from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Category, Product, Customer, Supplier, Discount,
    Sale, SaleItem, PurchaseOrder, PurchaseOrderItem,
    Expense, ActivityLog
)


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(source='products.count', read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'product_count']


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True, default='')

    class Meta:
        model = Product
        fields = [
            'id', 'sku', 'name', 'category', 'category_name',
            'supplier', 'supplier_name', 'barcode',
            'cost_price', 'selling_price', 'stock_quantity',
            'reorder_level', 'image_url', 'created_at'
        ]


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'


class DiscountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Discount
        fields = '__all__'


class SaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = SaleItem
        fields = ['id', 'product', 'product_name', 'quantity', 'price_at_sale']


class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, read_only=True)
    cashier_name = serializers.CharField(source='cashier.username', read_only=True, default='')
    customer_name = serializers.CharField(source='customer.name', read_only=True, default='')

    class Meta:
        model = Sale
        fields = [
            'id', 'cashier', 'cashier_name', 'customer', 'customer_name',
            'discount', 'discount_amount', 'total_amount', 'tax_amount',
            'payment_method', 'amount_tendered', 'change_due',
            'status', 'created_at', 'items'
        ]


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = PurchaseOrderItem
        fields = ['id', 'product', 'product_name', 'quantity', 'unit_cost']


class PurchaseOrderSerializer(serializers.ModelSerializer):
    items = PurchaseOrderItemSerializer(many=True, read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = [
            'id', 'supplier', 'supplier_name', 'status',
            'total_cost', 'notes', 'created_at', 'received_at', 'items'
        ]


class ExpenseSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.username', read_only=True, default='')

    class Meta:
        model = Expense
        fields = '__all__'


class ActivityLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True, default='System')

    class Meta:
        model = ActivityLog
        fields = ['id', 'user', 'username', 'action', 'target', 'details', 'timestamp']


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_active', 'is_superuser', 'is_staff', 'date_joined', 'role']

    def get_role(self, obj):
        return 'Admin' if obj.is_superuser else 'Cashier'