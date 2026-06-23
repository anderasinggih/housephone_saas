<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\StockController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\ShiftController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\StoreManagementController;
use App\Http\Controllers\ActivityLogController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('dashboard');
});

Route::get('/invoice/{invoice_number}', [SaleController::class, 'publicInvoice'])->name('public.invoice');

Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Timeline
    Route::get('/timeline', [ActivityLogController::class, 'index'])->name('timeline.index');

    // Stocks
    Route::get('/selling', [StockController::class, 'readyStock'])->name('selling.index');
    Route::get('/sale-data', [StockController::class, 'manageStock'])->name('sale-data.index');
    Route::post('/stocks', [StockController::class, 'store'])->name('stocks.store');
    Route::post('/stocks/batch', [StockController::class, 'storeBatch'])->name('stocks.store-batch');
    Route::post('/stocks/transfer', [StockController::class, 'transfer'])->name('stocks.transfer');
    Route::post('/stocks/transfer/{transfer}/approve', [StockController::class, 'approveTransfer'])->name('stocks.transfer.approve');
    Route::post('/parameters/value', [StockController::class, 'storeParameterValue'])->name('parameters.value.store');
    Route::post('/parameters/value/{value}/toggle', [StockController::class, 'toggleParameterValue'])->name('parameters.value.toggle');
    Route::get('/settings/parameters', [StockController::class, 'parameters'])->name('settings.parameters');

    // Sales
    Route::get('/sales-history', [SaleController::class, 'history'])->name('sales-history.index');
    Route::post('/sales/checkout', [SaleController::class, 'checkout'])->name('sales.checkout');
    Route::post('/sales/{sale}/void', [SaleController::class, 'void'])->name('sales.void');
    Route::post('/sales/{sale}/void/approve', [SaleController::class, 'approveVoid'])->name('sales.void.approve');
    Route::post('/sales/return', [SaleController::class, 'returnItem'])->name('sales.return');
    Route::post('/sales/warranty', [SaleController::class, 'warrantyClaim'])->name('sales.warranty');
    Route::post('/sales/warranty/{repair}/update', [SaleController::class, 'updateWarranty'])->name('sales.warranty.update');

    // Customers
    Route::get('/customers', [CustomerController::class, 'index'])->name('customers.index');

    // Shifts & Attendance
    Route::get('/shifts', [ShiftController::class, 'index'])->name('shifts.index');
    Route::post('/shifts/clock-in', [ShiftController::class, 'clockIn'])->name('shifts.clock-in');
    Route::post('/shifts/clock-out', [ShiftController::class, 'clockOut'])->name('shifts.clock-out');
    Route::post('/shifts/cash-drop', [ShiftController::class, 'cashDrop'])->name('shifts.cash-drop');
    Route::post('/shifts/petty-cash', [ShiftController::class, 'pettyCash'])->name('shifts.petty-cash');

    // User Management
    Route::get('/users', [UserController::class, 'index'])->name('users.index');
    Route::post('/users', [UserController::class, 'store'])->name('users.store');
    Route::patch('/users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');

    // Store Management
    Route::get('/stores', [StoreManagementController::class, 'index'])->name('stores.index');
    Route::post('/stores', [StoreManagementController::class, 'store'])->name('stores.store');
    Route::patch('/stores/{store}', [StoreManagementController::class, 'update'])->name('stores.update');
    Route::delete('/stores/{store}', [StoreManagementController::class, 'destroy'])->name('stores.destroy');

    // General Settings & Schedules
    Route::get('/settings/general', [\App\Http\Controllers\GeneralSettingsController::class, 'index'])->name('settings.general');
    Route::post('/settings/general', [\App\Http\Controllers\GeneralSettingsController::class, 'update'])->name('settings.general.update');
    Route::post('/settings/schedule', [\App\Http\Controllers\GeneralSettingsController::class, 'storeSchedule'])->name('settings.schedule.store');
    Route::delete('/settings/schedule/{schedule}', [\App\Http\Controllers\GeneralSettingsController::class, 'destroySchedule'])->name('settings.schedule.destroy');

    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
