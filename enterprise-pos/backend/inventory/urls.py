from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, ProductViewSet, SaleViewSet,
    CustomerViewSet, SupplierViewSet, DiscountViewSet,
    PurchaseOrderViewSet, ExpenseViewSet, ActivityLogViewSet,
    process_checkout, process_refund, get_reports, get_dashboard,
    get_current_user, export_sales_csv, export_inventory_csv,
    stock_adjustment, create_purchase_order, get_low_stock, get_users
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'products', ProductViewSet)
router.register(r'sales', SaleViewSet, basename='sale')
router.register(r'customers', CustomerViewSet)
router.register(r'suppliers', SupplierViewSet)
router.register(r'discounts', DiscountViewSet)
router.register(r'purchase-orders', PurchaseOrderViewSet)
router.register(r'expenses', ExpenseViewSet)
router.register(r'activity-log', ActivityLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('checkout/', process_checkout, name='checkout'),
    path('refund/<int:sale_id>/', process_refund, name='refund'),
    path('reports/', get_reports, name='reports'),
    path('dashboard/', get_dashboard, name='dashboard'),
    path('me/', get_current_user, name='current_user'),
    path('export/sales/', export_sales_csv, name='export_sales'),
    path('export/inventory/', export_inventory_csv, name='export_inventory'),
    path('stock-adjustment/', stock_adjustment, name='stock_adjustment'),
    path('create-po/', create_purchase_order, name='create_po'),
    path('low-stock/', get_low_stock, name='low_stock'),
    path('users/', get_users, name='users'),
]