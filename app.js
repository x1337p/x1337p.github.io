document.addEventListener('DOMContentLoaded', () => {
    // Проверяем, есть ли сохраненный профиль
    const savedProfile = localStorage.getItem('userProfile');
    const profileSetup = document.getElementById('profileSetup');
    const mainContent = document.getElementById('mainContent');

    if (!savedProfile) {
        // Показываем форму регистрации
        profileSetup.style.display = 'block';
        mainContent.style.display = 'none';
        setupProfileForm();
    } else {
        // Показываем основной контент
        profileSetup.style.display = 'none';
        mainContent.style.display = 'block';
        initializeSwiper();
    }
});

function setupProfileForm() {
    const form = document.getElementById('profileForm');
    const photoInput = document.getElementById('photoInput');
    const photoPreview = document.querySelector('.photo-preview');
    const interestInput = document.getElementById('interestInput');
    const interestsTags = document.getElementById('interestsTags');
    const interests = new Set();

    const ageInput = document.getElementById('age');
    
    // Добавляем валидацию возраста
    ageInput.addEventListener('input', (e) => {
        const age = parseInt(e.target.value);
        if (age < 14) {
            ageInput.setCustomValidity('Минимальный возраст должен быть 14 лет');
        } else if (age > 100) {
            ageInput.setCustomValidity('Максимальный возраст должен быть 100 лет');
        } else {
            ageInput.setCustomValidity('');
        }
    });

    // Обработка загрузки фото
    photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                photoPreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            };
            reader.readAsDataURL(file);
        }
    });

    const interestButtons = document.querySelectorAll('.interest-btn');
    const selectedInterests = new Set();
    const selectedInterestsContainer = document.getElementById('selectedInterests');
    const minInterests = 3;

    interestButtons.forEach(button => {
        button.addEventListener('click', () => {
            const interest = button.dataset.interest;
            
            if (button.classList.contains('selected')) {
                button.classList.remove('selected');
                selectedInterests.delete(interest);
                removeInterestTag(interest);
            } else {
                button.classList.add('selected');
                selectedInterests.add(interest);
                addInterestTag(interest);
            }
            
            validateInterests();
        });
    });

    function addInterestTag(interest) {
        const tag = document.createElement('div');
        tag.className = 'selected-interest-tag';
        tag.innerHTML = `
            ${interest}
            <button onclick="removeInterest('${interest}')">
                <i class="fas fa-times"></i>
            </button>
        `;
        selectedInterestsContainer.appendChild(tag);
    }

    function removeInterestTag(interest) {
        const tags = selectedInterestsContainer.getElementsByClassName('selected-interest-tag');
        for (let tag of tags) {
            if (tag.textContent.trim() === interest) {
                tag.remove();
                break;
            }
        }
    }

    // Глобальная функция для удаления интереса
    window.removeInterest = (interest) => {
        selectedInterests.delete(interest);
        removeInterestTag(interest);
        const button = Array.from(interestButtons).find(btn => btn.dataset.interest === interest);
        if (button) button.classList.remove('selected');
        validateInterests();
    };

    function validateInterests() {
        const submitButton = document.querySelector('.btn-submit');
        if (selectedInterests.size < minInterests) {
            submitButton.disabled = true;
            submitButton.style.opacity = '0.5';
        } else {
            submitButton.disabled = false;
            submitButton.style.opacity = '1';
        }
    }

    // Обработка отправки формы
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (selectedInterests.size < minInterests) {
            alert(`Пожалуйста, выберите минимум ${minInterests} интереса`);
            return;
        }

        const age = parseInt(document.getElementById('age').value);
        if (age < 14 || age > 100) {
            return;
        }

        const formData = {
            photo: photoPreview.querySelector('img')?.src || null,
            name: document.getElementById('name').value,
            age: age,
            city: document.getElementById('city').value,
            bio: document.getElementById('bio').value,
            interests: Array.from(selectedInterests)
        };

        // Сохраняем профиль
        localStorage.setItem('userProfile', JSON.stringify(formData));

        // Анимированный переход к основному контенту
        profileSetup.classList.add('fade-out');
        setTimeout(() => {
            profileSetup.style.display = 'none';
            mainContent.style.display = 'block';
            setTimeout(() => mainContent.classList.add('fade-in'), 100);
            initializeSwiper();
        }, 500);
    });
}

function initializeSwiper() {
    const profileCard = document.querySelector('.profile-card');
    const likeButton = document.querySelector('.btn-like');
    const dislikeButton = document.querySelector('.btn-dislike');
    
    // Добавляем элементы для отображения действий при свайпе
    const swipeInfo = `
        <div class="swipe-info like-info">ЛАЙК</div>
        <div class="swipe-info nope-info">ДИЗЛАЙК</div>
    `;
    profileCard.insertAdjacentHTML('beforeend', swipeInfo);
    
    // Переменные для отслеживания свайпа
    let startX = 0;
    let startY = 0;
    let moveX = 0;
    let moveY = 0;
    let isDragging = false;
    
    // Обработчики для десктопа
    profileCard.addEventListener('mousedown', startSwipe);
    document.addEventListener('mousemove', moveSwipe);
    document.addEventListener('mouseup', endSwipe);
    
    // Обработчики для мобильных устройств
    profileCard.addEventListener('touchstart', (e) => {
        startSwipe(e.touches[0]);
    });
    document.addEventListener('touchmove', (e) => {
        moveSwipe(e.touches[0]);
        e.preventDefault(); // Предотвращаем скролл страницы при свайпе
    }, { passive: false });
    document.addEventListener('touchend', endSwipe);
    
    // Кнопки лайк/дизлайк
    likeButton.addEventListener('click', () => handleLike());
    dislikeButton.addEventListener('click', () => handleDislike());
    
    function startSwipe(e) {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        profileCard.classList.add('swiping');
    }
    
    function moveSwipe(e) {
        if (!isDragging) return;
        
        moveX = e.clientX - startX;
        moveY = e.clientY - startY;
        
        // Вычисляем угол поворота на основе перемещения
        const rotate = moveX * 0.1;
        
        // Применяем трансформацию
        profileCard.style.transform = `translate(${moveX}px, ${moveY}px) rotate(${rotate}deg)`;
        
        // Показываем/скрываем индикаторы LIKE/NOPE
        const likeInfo = document.querySelector('.like-info');
        const nopeInfo = document.querySelector('.nope-info');
        
        if (moveX > 50) {
            likeInfo.style.opacity = Math.min(moveX / 100, 1);
            nopeInfo.style.opacity = 0;
        } else if (moveX < -50) {
            nopeInfo.style.opacity = Math.min(Math.abs(moveX) / 100, 1);
            likeInfo.style.opacity = 0;
        } else {
            likeInfo.style.opacity = 0;
            nopeInfo.style.opacity = 0;
        }
    }
    
    function endSwipe() {
        if (!isDragging) return;
        isDragging = false;
        profileCard.classList.remove('swiping');
        
        // Определяем, было ли достаточное смещение для свайпа
        if (moveX > 100) {
            handleLike();
        } else if (moveX < -100) {
            handleDislike();
        } else {
            resetCardPosition();
        }
    }
    
    function resetCardPosition() {
        profileCard.style.transform = 'none';
        document.querySelector('.like-info').style.opacity = 0;
        document.querySelector('.nope-info').style.opacity = 0;
    }
    
    function handleLike() {
        console.log('Профиль понравился');
        animateSwipe('right');
    }
    
    function handleDislike() {
        console.log('Профиль пропущен');
        animateSwipe('left');
    }
    
    function animateSwipe(direction) {
        const screenWidth = window.innerWidth;
        const rotation = direction === 'right' ? 30 : -30;
        const translateX = direction === 'right' ? screenWidth : -screenWidth;
        
        profileCard.style.transition = 'transform 0.5s ease-out';
        profileCard.style.transform = `translate(${translateX}px, 0) rotate(${rotation}deg)`;
        
        setTimeout(() => {
            profileCard.style.transition = 'none';
            profileCard.style.transform = 'none';
            
            // Здесь можно добавить логику загрузки следующего профиля
            setTimeout(() => {
                profileCard.style.transition = 'transform 0.5s';
            }, 50);
        }, 500);
    }
}

// Добавляем стили анимации
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        to {
            transform: translateX(-100%);
            opacity: 0;
        }
    }
    
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
`;
document.head.appendChild(style);
