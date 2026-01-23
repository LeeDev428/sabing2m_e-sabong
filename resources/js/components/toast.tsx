export type ToastType = 'success' | 'error' | 'warning' | 'info';

export function showToast(message: string, type: ToastType = 'info', duration = 4000) {
    // Create toast element
    const toastEl = document.createElement('div');
    toastEl.className = 'fixed top-4 right-4 z-[99999] transition-all duration-300 ease-out';
    toastEl.style.transform = 'translateX(400px)';
    toastEl.style.opacity = '0';
    
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ',
    };

    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500',
    };

    toastEl.innerHTML = `
        <div class="${colors[type]} text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 min-w-[300px] max-w-md">
            <div class="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xl">
                ${icons[type]}
            </div>
            <div class="flex-1">
                <p class="font-semibold text-sm leading-tight">${message}</p>
            </div>
            <button class="flex-shrink-0 text-white/80 hover:text-white transition-colors toast-close">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    `;

    document.body.appendChild(toastEl);

    // Animate in
    requestAnimationFrame(() => {
        toastEl.style.transform = 'translateX(0)';
        toastEl.style.opacity = '1';
    });

    // Remove function
    const remove = () => {
        toastEl.style.transform = 'translateX(400px)';
        toastEl.style.opacity = '0';
        setTimeout(() => {
            if (toastEl.parentNode) {
                toastEl.parentNode.removeChild(toastEl);
            }
        }, 300);
    };

    // Close button
    const closeBtn = toastEl.querySelector('.toast-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', remove);
    }

    // Auto remove
    setTimeout(remove, duration);
}
