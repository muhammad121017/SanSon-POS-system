from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.admin import GroupAdmin as BaseGroupAdmin
from django.contrib.auth.models import User, Group

from unfold.admin import ModelAdmin, TabularInline
from unfold.forms import AdminPasswordChangeForm, UserChangeForm, UserCreationForm

from .models import (
    Category, Product, Supplier, Customer, Discount,
    Sale, SaleItem, PurchaseOrder, PurchaseOrderItem,
    Expense, ActivityLog
)

# ── Re-register Django built-in models with Unfold theme ──────────────
admin.site.unregister(User)
admin.site.unregister(Group)

@admin.register(User)
class UserAdmin(BaseUserAdmin, ModelAdmin):
    form = UserChangeForm
    add_form = UserCreationForm
    change_password_form = AdminPasswordChangeForm

@admin.register(Group)
class GroupAdmin(BaseGroupAdmin, ModelAdmin):
    pass

# Re-register Token (DRF uses TokenProxy internally)
try:
    from rest_framework.authtoken.models import TokenProxy
    from rest_framework.authtoken.admin import TokenAdmin as BaseTokenAdmin
    admin.site.unregister(TokenProxy)

    @admin.register(TokenProxy)
    class TokenAdmin(BaseTokenAdmin, ModelAdmin):
        pass
except Exception:
    pass

# Inline models for cleaner layouts
class SaleItemInline(TabularInline):
    model = SaleItem
    extra = 0
    readonly_fields = ('product', 'quantity', 'price_at_sale')

class PurchaseOrderItemInline(TabularInline):
    model = PurchaseOrderItem
    extra = 0

@admin.register(Category)
class CategoryAdmin(ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)

@admin.register(Supplier)
class SupplierAdmin(ModelAdmin):
    list_display = ('name', 'contact_person', 'phone', 'email')
    search_fields = ('name', 'contact_person')

@admin.register(Product)
class ProductAdmin(ModelAdmin):
    list_display = ('name', 'sku', 'barcode', 'category', 'supplier', 'cost_price', 'selling_price', 'stock_quantity', 'reorder_level')
    search_fields = ('name', 'sku', 'barcode')
    list_filter = ('category', 'supplier')

@admin.register(Customer)
class CustomerAdmin(ModelAdmin):
    list_display = ('name', 'phone', 'email', 'loyalty_points', 'total_spent', 'created_at')
    search_fields = ('name', 'phone', 'email')
    readonly_fields = ('created_at',)

@admin.register(Discount)
class DiscountAdmin(ModelAdmin):
    list_display = ('name', 'code', 'discount_type', 'value', 'min_purchase', 'is_active', 'start_date', 'end_date')
    search_fields = ('name', 'code')
    list_filter = ('discount_type', 'is_active')

@admin.register(Sale)
class SaleAdmin(ModelAdmin):
    list_display = ('id', 'created_at', 'cashier', 'customer', 'payment_method', 'total_amount', 'status')
    list_filter = ('payment_method', 'status', 'created_at')
    search_fields = ('id', 'cashier__username', 'customer__name')
    readonly_fields = ('created_at',)
    inlines = [SaleItemInline]

@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(ModelAdmin):
    list_display = ('id', 'supplier', 'status', 'total_cost', 'created_at', 'received_at')
    list_filter = ('status', 'created_at')
    search_fields = ('id', 'supplier__name')
    inlines = [PurchaseOrderItemInline]

@admin.register(Expense)
class ExpenseAdmin(ModelAdmin):
    list_display = ('category', 'amount', 'payment_method', 'date', 'created_by')
    list_filter = ('category', 'payment_method', 'date')
    search_fields = ('description', 'category')

@admin.register(ActivityLog)
class ActivityLogAdmin(ModelAdmin):
    list_display = ('timestamp', 'user', 'action', 'target', 'details')
    list_filter = ('action', 'timestamp')
    search_fields = ('user__username', 'action', 'target', 'details')
    # Make audit logs read-only to prevent tampering in Django Admin
    def has_add_permission(self, request, obj=None): return False
    def has_change_permission(self, request, obj=None): return False
    def has_delete_permission(self, request, obj=None): return False

from django.contrib.admin.models import LogEntry

@admin.register(LogEntry)
class LogEntryAdmin(ModelAdmin):
    list_display = ['action_time', 'user', 'content_type', 'object_repr', 'action_flag', 'change_message']
    search_fields = ['object_repr', 'change_message']
    list_filter = ['action_time', 'user', 'content_type', 'action_flag']
    
    def has_add_permission(self, request): return False
    def has_change_permission(self, request, obj=None): return False
    def has_delete_permission(self, request, obj=None): return False