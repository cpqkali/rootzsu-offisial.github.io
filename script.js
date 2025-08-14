
document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('main');
    const servicesGrid = document.querySelector('.services-grid');

    function setActiveSection(targetSectionId) {
        navLinks.forEach(navLink => navLink.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-link[data-section="${targetSectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        sections.forEach(section => {
            if (section.id === targetSectionId) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if (e.target.dataset.section) {
                e.preventDefault();
                const targetSection = e.target.dataset.section;
                setActiveSection(targetSection);
                if (targetSection === 'services') {
                    fetchServices();
                }
            }
        });
    });

    // ---- API ЭНДПОИНТЫ ----
    const API_URL = 'https://b2dc1005b2cbd4cb2a5defb7547b4b9b.serveo.net/api';
    const ENDPOINTS = {
        services: `${API_URL}/services`,
        login: `${API_URL}/login`,
        adminLogin: `${API_URL}/admin/login`,
        userOrders: `${API_URL}/user/orders`,
        adminStats: `${API_URL}/admin/stats`,
    };

    let currentUser = null;
    let isAdmin = false;

    // ---- ЛОГИКА ОТОБРАЖЕНИЯ СПИСКА УСЛУГ ----
    async function fetchServices() {
        if (!servicesGrid) return;
        servicesGrid.innerHTML = '<p class="loading-message">Загрузка услуг...</p>';
        try {
            const response = await fetch(ENDPOINTS.services);
            if (!response.ok) {
                throw new Error('Не удалось загрузить список услуг');
            }
            const services = await response.json();
            renderServices(services);
        } catch (error) {
            console.error('Ошибка:', error);
            servicesGrid.innerHTML = '<p class="error-message">Произошла ошибка при загрузке списка услуг.</p>';
        }
    }

    function renderServices(services) {
        if (services.length === 0) {
            servicesGrid.innerHTML = '<p class="empty-list-message">Список услуг пока пуст.</p>';
            return;
        }
        servicesGrid.innerHTML = '';
        services.forEach(service => {
            const serviceItem = document.createElement('div');
            serviceItem.classList.add('service-item');
            serviceItem.innerHTML = `
                <h3>${service.name}</h3>
                <p>${service.description}</p>
                <div class="prices">
                    <span>💲 ${service.price_usd} USD</span>
                    <span>₿ ${service.price_btc} BTC</span>
                    <span>⭐️ ${service.price_stars} STARS</span>
                </div>
            `;
            servicesGrid.appendChild(serviceItem);
        });
    }

    // ---- ЛОГИКА АВТОРИЗАЦИИ ПОЛЬЗОВАТЕЛЯ ----

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const tgId = document.getElementById('tg-id').value;

            try {
                const response = await fetch(ENDPOINTS.login, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tgId })
                });

                if (!response.ok) {
                    throw new Error('Неверный Telegram ID');
                }

                const userData = await response.json();
                currentUser = userData;
                isAdmin = false;
                updateUIForUser();
                fetchUserOrders(tgId);
            } catch (error) {
                alert('Ошибка входа: ' + error.message);
            }
        });
    }
    
    // ---- ЛОГИКА АВТОРИЗАЦИИ АДМИНА ----

    const adminLoginForm = document.getElementById('admin-login-form');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const adminId = document.getElementById('admin-id').value;

            try {
                const response = await fetch(ENDPOINTS.adminLogin, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ adminId })
                });

                if (!response.ok) {
                    throw new Error('Неверный ID администратора');
                }
                
                currentUser = { id: adminId, name: 'Admin' };
                isAdmin = true;
                updateUIForAdmin();
                fetchAdminStats();
            } catch (error) {
                alert('Ошибка входа: ' + error.message);
            }
        });
    }

    // ---- ЛОГИКА ОБНОВЛЕНИЯ ИНТЕРФЕЙСА ПОСЛЕ ВХОДА ----

    function updateUIForUser() {
        document.getElementById('login-form-container').style.display = 'none';
        document.getElementById('user-dashboard').style.display = 'block';
        document.getElementById('user-name').textContent = currentUser.name || currentUser.id;
    }

    function updateUIForAdmin() {
        document.getElementById('admin-login-container').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'block';
    }

    async function fetchUserOrders(userId) {
        const ordersContainer = document.getElementById('user-orders-container');
        if (!ordersContainer) return;
        ordersContainer.innerHTML = '<p>Загрузка заказов...</p>';
        try {
            const response = await fetch(`${ENDPOINTS.userOrders}?userId=${userId}`);
            if (!response.ok) {
                throw new Error('Не удалось загрузить заказы');
            }
            const orders = await response.json();
            renderUserOrders(orders);
        } catch (error) {
            console.error('Ошибка:', error);
            ordersContainer.innerHTML = '<p class="error">Произошла ошибка при загрузке заказов.</p>';
        }
    }

    function renderUserOrders(orders) {
        const ordersContainer = document.getElementById('user-orders-container');
        if (!ordersContainer) return;
        if (orders.length === 0) {
            ordersContainer.innerHTML = '<p>У вас пока нет заказов.</p>';
            return;
        }
        ordersContainer.innerHTML = '';
        orders.forEach(order => {
            const orderItem = document.createElement('div');
            orderItem.classList.add('order-item');
            orderItem.innerHTML = `
                <p><strong>Заказ #${order.order_id}</strong></p>
                <p>Услуга: ${order.service_name}</p>
                <p>Статус: <span>${order.status}</span></p>
            `;
            ordersContainer.appendChild(orderItem);
        });
    }

    async function fetchAdminStats() {
        const statsUsers = document.getElementById('stats-users');
        const statsOrders = document.getElementById('stats-orders');
        if (!statsUsers || !statsOrders) return;
        statsUsers.textContent = '...';
        statsOrders.textContent = '...';
        try {
            const response = await fetch(ENDPOINTS.adminStats);
            if (!response.ok) {
                throw new Error('Не удалось загрузить статистику');
            }
            const stats = await response.json();
            statsUsers.textContent = stats.user_count;
            statsOrders.textContent = stats.order_count;
        } catch (error) {
            console.error('Ошибка:', error);
            statsUsers.textContent = 'Ошибка';
            statsOrders.textContent = 'Ошибка';
        }
    }

    // ---- ЛОГИКА ВЫХОДА ----

    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            currentUser = null;
            isAdmin = false;
            document.getElementById('login-form-container').style.display = 'block';
            document.getElementById('user-dashboard').style.display = 'none';
            alert('Вы вышли из аккаунта.');
        });
    }

    const adminLogoutButton = document.getElementById('admin-logout-button');
    if (adminLogoutButton) {
        adminLogoutButton.addEventListener('click', () => {
            currentUser = null;
            isAdmin = false;
            document.getElementById('admin-login-container').style.display = 'block';
            document.getElementById('admin-dashboard').style.display = 'none';
            alert('Вы вышли из админ-панели.');
        });
    }

    // Проверяем текущий URL и загружаем услуги, если страница прайс-листа активна
    const activeSection = document.querySelector('main.active');
    if (activeSection && activeSection.id === 'services') {
        fetchServices();
    }
});
