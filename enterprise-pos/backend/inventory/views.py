import csv
from datetime import timedelta
from decimal import Decimal

from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Sum, Count, F, Q
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response

from .models import (
    Category, Product, Customer, Supplier, Discount,
    Sale, SaleItem, PurchaseOrder, PurchaseOrderItem,
    Expense, ActivityLog
)
from .serializers import (
    CategorySerializer, ProductSerializer, CustomerSerializer,
    SupplierSerializer, DiscountSerializer, SaleSerializer,
    PurchaseOrderSerializer, PurchaseOrderItemSerializer,
    ExpenseSerializer, ActivityLogSerializer, UserSerializer
)


# ---------- helpers ----------
def log_activity(user, action, target='', details=''):
    ActivityLog.objects.create(user=user, action=action, target=target, details=details)


# ---------- standard CRUD viewsets ----------

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('category', 'supplier').all()
    serializer_class = ProductSerializer


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all().order_by('-created_at')
    serializer_class = CustomerSerializer

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        customer = self.get_object()
        sales = Sale.objects.filter(customer=customer).order_by('-created_at')
        return Response(SaleSerializer(sales, many=True).data)


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all().order_by('-created_at')
    serializer_class = SupplierSerializer


class DiscountViewSet(viewsets.ModelViewSet):
    queryset = Discount.objects.all().order_by('-created_at')
    serializer_class = DiscountSerializer


class SaleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Sale.objects.select_related('cashier', 'customer', 'discount').prefetch_related('items__product').all().order_by('-created_at')
    serializer_class = SaleSerializer


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.select_related('supplier').prefetch_related('items__product').all().order_by('-created_at')
    serializer_class = PurchaseOrderSerializer

    @action(detail=True, methods=['post'])
    def receive(self, request, pk=None):
        po = self.get_object()
        if po.status == 'Received':
            return Response({'error': 'Already received'}, status=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            for item in po.items.all():
                item.product.stock_quantity += item.quantity
                item.product.save()
            po.status = 'Received'
            po.received_at = timezone.now()
            po.save()
        if request.user.is_authenticated:
            log_activity(request.user, 'Received PO', f'PO #{po.id}', f'{po.items.count()} items restocked')
        return Response({'message': f'PO #{po.id} received. Stock updated.'})


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all().order_by('-date')
    serializer_class = ExpenseSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user if self.request.user.is_authenticated else None)


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ActivityLog.objects.select_related('user').all()
    serializer_class = ActivityLogSerializer


# ---------- custom endpoints ----------

@api_view(['POST'])
def process_checkout(request):
    cart = request.data.get('cart', [])
    payment_method = request.data.get('payment_method', 'Cash')
    amount_tendered = float(request.data.get('amount_tendered', 0))
    tax_rate = float(request.data.get('tax_rate', 0.0))
    customer_id = request.data.get('customer_id')
    discount_code = request.data.get('discount_code', '')

    try:
        with transaction.atomic():
            subtotal = 0
            sale_items_data = []

            for item in cart:
                product = Product.objects.get(id=item['id'])
                qty = int(item['qty'])

                if product.stock_quantity < qty:
                    raise ValueError(f"Insufficient stock for {product.name}")

                product.stock_quantity -= qty
                product.save()

                line_total = float(product.selling_price) * qty
                subtotal += line_total

                sale_items_data.append({
                    'product': product,
                    'quantity': qty,
                    'price_at_sale': product.selling_price
                })

            # Apply discount
            discount_obj = None
            discount_amount = 0
            if discount_code:
                try:
                    discount_obj = Discount.objects.get(code=discount_code, is_active=True)
                    now = timezone.now()
                    if discount_obj.start_date and now < discount_obj.start_date:
                        discount_obj = None
                    elif discount_obj.end_date and now > discount_obj.end_date:
                        discount_obj = None
                    elif subtotal < float(discount_obj.min_purchase):
                        discount_obj = None
                    else:
                        if discount_obj.discount_type == 'percentage':
                            discount_amount = subtotal * (float(discount_obj.value) / 100)
                        else:
                            discount_amount = float(discount_obj.value)
                except Discount.DoesNotExist:
                    pass

            tax_amount = (subtotal - discount_amount) * (tax_rate / 100)
            total_amount = subtotal - discount_amount + tax_amount
            change_due = amount_tendered - total_amount if payment_method == 'Cash' else 0

            # Link customer
            customer = None
            if customer_id:
                try:
                    customer = Customer.objects.get(id=customer_id)
                    customer.total_spent += Decimal(str(total_amount))
                    customer.loyalty_points += int(total_amount // 100)
                    customer.save()
                except Customer.DoesNotExist:
                    pass

            sale = Sale.objects.create(
                cashier=request.user if request.user.is_authenticated else None,
                customer=customer,
                discount=discount_obj,
                discount_amount=discount_amount,
                total_amount=total_amount,
                tax_amount=tax_amount,
                payment_method=payment_method,
                amount_tendered=amount_tendered,
                change_due=change_due,
                status='Completed'
            )

            for item_data in sale_items_data:
                SaleItem.objects.create(
                    sale=sale,
                    product=item_data['product'],
                    quantity=item_data['quantity'],
                    price_at_sale=item_data['price_at_sale']
                )

        if request.user.is_authenticated:
            log_activity(request.user, 'Completed Sale', f'Sale #{sale.id}', f'PKR {total_amount:.2f}')

        return Response({
            "message": "Sale completed successfully!",
            "sale_id": sale.id,
            "discount_amount": discount_amount
        })

    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": "An unexpected error occurred."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def process_refund(request, sale_id):
    try:
        with transaction.atomic():
            sale = Sale.objects.get(id=sale_id)
            if sale.status == 'Refunded':
                return Response({"error": "Sale is already refunded."}, status=status.HTTP_400_BAD_REQUEST)

            for item in sale.items.all():
                if item.product:
                    item.product.stock_quantity += item.quantity
                    item.product.save()

            # Reverse customer loyalty
            if sale.customer:
                sale.customer.total_spent -= sale.total_amount
                sale.customer.loyalty_points -= int(float(sale.total_amount) // 100)
                sale.customer.save()

            sale.status = 'Refunded'
            sale.save()

            if request.user.is_authenticated:
                log_activity(request.user, 'Refunded Sale', f'Sale #{sale.id}', f'PKR {sale.total_amount}')

            return Response({"message": f"Sale #{sale.id} successfully refunded."})
    except Sale.DoesNotExist:
        return Response({"error": "Sale not found."}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
def get_reports(request):
    total_products = Product.objects.count()
    low_stock_count = Product.objects.filter(stock_quantity__lte=F('reorder_level')).count()
    revenue_data = Sale.objects.filter(status='Completed').aggregate(total=Sum('total_amount'))
    total_revenue = float(revenue_data['total'] or 0)

    return Response({
        "total_products": total_products,
        "low_stock": low_stock_count,
        "total_revenue": total_revenue
    })


@api_view(['GET'])
def get_dashboard(request):
    now = timezone.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday_start = today_start - timedelta(days=1)
    week_start = today_start - timedelta(days=7)
    month_start = today_start - timedelta(days=30)

    completed = Sale.objects.filter(status='Completed')

    # Today's stats
    today_sales = completed.filter(created_at__gte=today_start)
    today_revenue = float(today_sales.aggregate(t=Sum('total_amount'))['t'] or 0)
    today_count = today_sales.count()

    # Yesterday
    yesterday_sales = completed.filter(created_at__gte=yesterday_start, created_at__lt=today_start)
    yesterday_revenue = float(yesterday_sales.aggregate(t=Sum('total_amount'))['t'] or 0)

    # This week
    week_revenue = float(completed.filter(created_at__gte=week_start).aggregate(t=Sum('total_amount'))['t'] or 0)

    # This month
    month_revenue = float(completed.filter(created_at__gte=month_start).aggregate(t=Sum('total_amount'))['t'] or 0)

    # All time
    total_revenue = float(completed.aggregate(t=Sum('total_amount'))['t'] or 0)

    # Top 10 products (by quantity sold)
    top_products = (
        SaleItem.objects
        .filter(sale__status='Completed', sale__created_at__gte=month_start)
        .values('product__name')
        .annotate(total_qty=Sum('quantity'), total_revenue=Sum(F('quantity') * F('price_at_sale')))
        .order_by('-total_qty')[:10]
    )

    # Revenue by category
    category_revenue = (
        SaleItem.objects
        .filter(sale__status='Completed', sale__created_at__gte=month_start)
        .values('product__category__name')
        .annotate(revenue=Sum(F('quantity') * F('price_at_sale')))
        .order_by('-revenue')
    )

    # Daily revenue for last 7 days
    daily_revenue = []
    for i in range(7):
        day_start = today_start - timedelta(days=6 - i)
        day_end = day_start + timedelta(days=1)
        rev = float(completed.filter(created_at__gte=day_start, created_at__lt=day_end).aggregate(t=Sum('total_amount'))['t'] or 0)
        daily_revenue.append({
            'date': day_start.strftime('%a'),
            'revenue': rev
        })

    # Hourly breakdown for today
    hourly = []
    for h in range(24):
        hour_start = today_start + timedelta(hours=h)
        hour_end = hour_start + timedelta(hours=1)
        rev = float(today_sales.filter(created_at__gte=hour_start, created_at__lt=hour_end).aggregate(t=Sum('total_amount'))['t'] or 0)
        hourly.append({'hour': f'{h:02d}:00', 'revenue': rev})

    # Inventory stats
    total_products = Product.objects.count()
    low_stock = Product.objects.filter(stock_quantity__lte=F('reorder_level')).count()
    out_of_stock = Product.objects.filter(stock_quantity=0).count()

    # Customer stats
    total_customers = Customer.objects.count()
    new_customers_month = Customer.objects.filter(created_at__gte=month_start).count()

    # Expense stats
    month_expenses = float(Expense.objects.filter(date__gte=month_start.date()).aggregate(t=Sum('amount'))['t'] or 0)

    return Response({
        'today_revenue': today_revenue,
        'today_count': today_count,
        'yesterday_revenue': yesterday_revenue,
        'week_revenue': week_revenue,
        'month_revenue': month_revenue,
        'total_revenue': total_revenue,
        'month_expenses': month_expenses,
        'month_profit': month_revenue - month_expenses,
        'top_products': list(top_products),
        'category_revenue': list(category_revenue),
        'daily_revenue': daily_revenue,
        'hourly_revenue': hourly,
        'total_products': total_products,
        'low_stock': low_stock,
        'out_of_stock': out_of_stock,
        'total_customers': total_customers,
        'new_customers_month': new_customers_month,
    })


@api_view(['GET'])
def get_current_user(request):
    if request.user.is_authenticated:
        role = 'Admin' if request.user.is_superuser else 'Cashier'
        return Response({'username': request.user.username, 'user_id': request.user.id, 'role': role})
    return Response({'username': 'Guest', 'user_id': 0, 'role': 'Admin'})


@api_view(['GET'])
def export_sales_csv(request):
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="sales_export.csv"'
    writer = csv.writer(response)
    writer.writerow(['ID', 'Date', 'Cashier', 'Customer', 'Payment', 'Subtotal', 'Tax', 'Discount', 'Total', 'Status'])
    for sale in Sale.objects.select_related('cashier', 'customer').order_by('-created_at'):
        writer.writerow([
            sale.id, sale.created_at.strftime('%Y-%m-%d %H:%M'),
            sale.cashier.username if sale.cashier else '', sale.customer.name if sale.customer else '',
            sale.payment_method, float(sale.total_amount) + float(sale.discount_amount) - float(sale.tax_amount),
            float(sale.tax_amount), float(sale.discount_amount), float(sale.total_amount), sale.status
        ])
    return response


@api_view(['GET'])
def export_inventory_csv(request):
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="inventory_export.csv"'
    writer = csv.writer(response)
    writer.writerow(['SKU', 'Name', 'Category', 'Cost Price', 'Selling Price', 'Stock', 'Reorder Level', 'Supplier'])
    for p in Product.objects.select_related('category', 'supplier').all():
        writer.writerow([
            p.sku, p.name, p.category.name, float(p.cost_price),
            float(p.selling_price), p.stock_quantity, p.reorder_level,
            p.supplier.name if p.supplier else ''
        ])
    return response


@api_view(['POST'])
def stock_adjustment(request):
    product_id = request.data.get('product_id')
    new_quantity = request.data.get('new_quantity')
    reason = request.data.get('reason', '')

    try:
        product = Product.objects.get(id=product_id)
        old_qty = product.stock_quantity
        product.stock_quantity = int(new_quantity)
        product.save()

        if request.user.is_authenticated:
            log_activity(
                request.user, 'Stock Adjustment', product.name,
                f'Changed from {old_qty} to {new_quantity}. Reason: {reason}'
            )

        return Response({'message': f'Stock updated for {product.name}', 'old': old_qty, 'new': product.stock_quantity})
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
def create_purchase_order(request):
    supplier_id = request.data.get('supplier_id')
    items = request.data.get('items', [])
    notes = request.data.get('notes', '')

    try:
        supplier = Supplier.objects.get(id=supplier_id)
        total_cost = 0

        with transaction.atomic():
            po = PurchaseOrder.objects.create(supplier=supplier, notes=notes)
            for item in items:
                product = Product.objects.get(id=item['product_id'])
                qty = int(item['quantity'])
                cost = float(item['unit_cost'])
                PurchaseOrderItem.objects.create(
                    purchase_order=po, product=product, quantity=qty, unit_cost=cost
                )
                total_cost += qty * cost
            po.total_cost = total_cost
            po.save()

        if request.user.is_authenticated:
            log_activity(request.user, 'Created PO', f'PO #{po.id}', f'Supplier: {supplier.name}, Total: PKR {total_cost:.2f}')

        return Response({'message': f'PO #{po.id} created', 'po_id': po.id})
    except Supplier.DoesNotExist:
        return Response({'error': 'Supplier not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
def get_low_stock(request):
    products = Product.objects.filter(stock_quantity__lte=F('reorder_level')).select_related('category', 'supplier')
    return Response(ProductSerializer(products, many=True).data)


@api_view(['GET'])
def get_users(request):
    users = User.objects.all().order_by('-date_joined')
    return Response(UserSerializer(users, many=True).data)