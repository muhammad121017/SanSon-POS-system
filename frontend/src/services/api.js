import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/inventory/';
const AUTH_BASE = import.meta.env.VITE_AUTH_BASE_URL || 'http://127.0.0.1:8000/api/auth/';

const API = axios.create({ baseURL: API_BASE });
const AUTH_API = axios.create({ baseURL: AUTH_BASE });

// Automatically attach login token to headers if present
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Token ${token}`;
    return config;
});

// Authentication Endpoints
export const loginUser = async (credentials) => {
    const response = await AUTH_API.post('login/', credentials, {
        headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
};
export const getUserRole = async () => (await API.get('me/')).data;
export const getUsers = async () => (await API.get('users/')).data;

// Products & Categories
export const getProducts = async () => (await API.get('products/')).data;
export const createProduct = async (data) => (await API.post('products/', data)).data;
export const updateProduct = async (id, data) => (await API.put(`products/${id}/`, data)).data;
export const deleteProduct = async (id) => (await API.delete(`products/${id}/`)).data;

export const getCategories = async () => (await API.get('categories/')).data;
export const createCategory = async (data) => (await API.post('categories/', data)).data;
export const deleteCategory = async (id) => (await API.delete(`categories/${id}/`)).data;

// Customer Management (CRM)
export const getCustomers = async () => (await API.get('customers/')).data;
export const createCustomer = async (data) => (await API.post('customers/', data)).data;
export const updateCustomer = async (id, data) => (await API.put(`customers/${id}/`, data)).data;
export const deleteCustomer = async (id) => (await API.delete(`customers/${id}/`)).data;
export const getCustomerHistory = async (id) => (await API.get(`customers/${id}/history/`)).data;

// Supplier Management
export const getSuppliers = async () => (await API.get('suppliers/')).data;
export const createSupplier = async (data) => (await API.post('suppliers/', data)).data;
export const updateSupplier = async (id, data) => (await API.put(`suppliers/${id}/`, data)).data;
export const deleteSupplier = async (id) => (await API.delete(`suppliers/${id}/`)).data;

// Purchase Orders (Stock Restocking)
export const getPurchaseOrders = async () => (await API.get('purchase-orders/')).data;
export const createPurchaseOrder = async (payload) => (await API.post('create-po/', payload)).data;
export const receivePurchaseOrder = async (id) => (await API.post(`purchase-orders/${id}/receive/`)).data;

// Expense Tracking
export const getExpenses = async () => (await API.get('expenses/')).data;
export const createExpense = async (data) => (await API.post('expenses/', data)).data;
export const deleteExpense = async (id) => (await API.delete(`expenses/${id}/`)).data;

// Discounts & Promo Codes
export const getDiscounts = async () => (await API.get('discounts/')).data;
export const createDiscount = async (data) => (await API.post('discounts/', data)).data;
export const deleteDiscount = async (id) => (await API.delete(`discounts/${id}/`)).data;

// Transactions & History
export const getSales = async () => (await API.get('sales/')).data;
export const processCheckout = async (payload) => (await API.post('checkout/', payload)).data;
export const processRefund = async (id) => (await API.post(`refund/${id}/`)).data;

// Analytics & Reports
export const getReports = async () => (await API.get('reports/')).data;
export const getDashboardData = async () => (await API.get('dashboard/')).data;
export const getLowStock = async () => (await API.get('low-stock/')).data;
export const stockAdjustment = async (payload) => (await API.post('stock-adjustment/', payload)).data;
export const getActivityLog = async () => (await API.get('activity-log/')).data;

export default API;