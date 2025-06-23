document.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('.ladi-form');
    const submitButton = form.querySelector('button[type="submit"]');
    const visualButton = document.querySelector('#BUTTON2');

    let isSubmitting = false;
    let submitTimeout = null;
    const socket = io('http://localhost:5500');

    socket.on('disconnect', () => {
        console.log('❌ WebSocket disconnected');
        showMessage('Lost realtime connection, please reload the page', 'error');
    });

    socket.on('new-rsvp', (data) => {
        console.log('🎉 New RSVP received:', data.data);
        if (data.data.name && !isSubmitting) {
            showMessage(`🎊 ${data.data.name} just sent their RSVP!`, 'info', 3000);
        }
    });

    if (form) {
        form.removeEventListener('submit', handleSubmit);
        form.addEventListener('submit', handleSubmit);

        if (visualButton) {
            visualButton.removeEventListener('click', handleVisualButtonClick);
            visualButton.addEventListener('click', handleVisualButtonClick);
        }
    }

    function handleSubmit(e) {
        e.preventDefault();
        e.stopPropagation();
        submitFormWithDebounce();
    }

    function handleVisualButtonClick(e) {
        e.preventDefault();
        e.stopPropagation();
        submitFormWithDebounce();
    }

    function submitFormWithDebounce() {
        if (submitTimeout) {
            clearTimeout(submitTimeout);
        }

        if (isSubmitting) {
            console.log('⚠️ Currently submitting, ignoring duplicate request');
            return;
        }

        submitTimeout = setTimeout(() => {
            submitForm();
        }, 100);
    }

    function submitForm() {
        if (isSubmitting) {
            console.log('⚠️ Currently submitting, ignoring');
            return;
        }

        const formData = new FormData(form);
        const name = formData.get('name');
        const message = formData.get('message');
        const attendance = formData.get('form_item4');

        if (!name || !name.trim()) {
            showMessage('Please enter your name!', 'error');
            return;
        }

        if (!attendance) {
            showMessage('Please select your attendance confirmation!', 'error');
            return;
        }

        isSubmitting = true;

        if (submitButton) submitButton.disabled = true;
        if (visualButton) {
            visualButton.style.pointerEvents = 'none';
            visualButton.style.opacity = '0.6';
            const buttonText = visualButton.querySelector('#BUTTON_TEXT2 p');
            if (buttonText) {
                buttonText.textContent = 'SENDING...';
            }
        }

        fetch('http://localhost:5500/submit-rsvp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name.trim(),
                message: message ? message.trim() : '',
                form_item4: attendance
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showMessage('🎉 ' + data.message, 'success');
                    form.reset();

                    const radioButtons = form.querySelectorAll('input[type="radio"]');
                    radioButtons.forEach(radio => {
                        radio.checked = false;
                        const span = radio.nextElementSibling;
                        if (span) {
                            span.setAttribute('data-checked', 'false');
                        }
                    });
                } else {
                    showMessage(data.message || 'An error occurred, please try again!', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                if (socket.connected) {
                    showMessage('Connection error, please try again!', 'error');
                } else {
                    showMessage('Connection lost, please check your internet and try again!', 'error');
                }
            })
            .finally(() => {
                setTimeout(() => {
                    isSubmitting = false;

                    if (submitButton) submitButton.disabled = false;
                    if (visualButton) {
                        visualButton.style.pointerEvents = 'auto';
                        visualButton.style.opacity = '1';
                        const buttonText = visualButton.querySelector('#BUTTON_TEXT2 p');
                        if (buttonText) {
                            buttonText.textContent = 'GỬI LỜI NHẮN VÀ XÁC NHẬN';
                        }
                    }
                }, 1000);
            });
    }

    const radioButtons = form.querySelectorAll('input[type="radio"]');
    radioButtons.forEach(radio => {
        radio.addEventListener('change', function () {
            const groupName = this.name;
            const allRadiosInGroup = form.querySelectorAll(`input[name="${groupName}"]`);
            allRadiosInGroup.forEach(r => {
                const span = r.nextElementSibling;
                if (span) {
                    span.setAttribute('data-checked', 'false');
                }
            });

            // Set checked for the selected radio
            const span = this.nextElementSibling;
            if (span) {
                span.setAttribute('data-checked', 'true');
            }
        });
    });

    function showMessage(message, type, duration = 5000) {
        const oldMessage = document.querySelector('.rsvp-message');
        if (oldMessage) {
            oldMessage.remove();
        }

        let backgroundColor;
        switch (type) {
            case 'success':
                backgroundColor = '#4CAF50';
                break;
            case 'error':
                backgroundColor = '#f44336';
                break;
            case 'info':
                backgroundColor = '#2196F3';
                break;
            default:
                backgroundColor = '#666';
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `rsvp-message rsvp-message-${type}`;
        messageDiv.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                color: white;
                font-weight: bold;
                z-index: 9999;
                max-width: 400px;
                animation: slideIn 0.3s ease-out;
                background-color: ${backgroundColor};
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            ">
                ${message}
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: none;
                    border: none;
                    color: white;
                    float: right;
                    font-size: 18px;
                    cursor: pointer;
                    margin-left: 10px;
                ">&times;</button>
            </div>
        `;

        if (!document.querySelector('#rsvp-message-styles')) {
            const styles = document.createElement('style');
            styles.id = 'rsvp-message-styles';
            styles.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(messageDiv);

        setTimeout(() => {
            if (messageDiv && messageDiv.parentElement) {
                const div = messageDiv.querySelector('div');
                if (div) {
                    div.style.animation = 'slideOut 0.3s ease-in';
                    setTimeout(() => {
                        messageDiv.remove();
                    }, 300);
                }
            }
        }, duration);
    }
});

function downloadExcel() {
    window.open('/download-excel', '_blank');
}

if (!window.io) {
    const script = document.createElement('script');
    script.src = 'https://cdn.socket.io/4.7.2/socket.io.min.js';
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
} 