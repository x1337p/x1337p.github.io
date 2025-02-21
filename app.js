document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        profileSetup: document.getElementById('profileSetup'),
        mainContent: document.getElementById('mainContent'),
        editProfileBtn: document.getElementById('editProfileBtn'),
        form: document.getElementById('profileForm'),
        photoInput: document.getElementById('photoInput'),
        photoPreview: document.querySelector('.photo-preview'),
        selectedInterests: new Set(),
        interestsContainer: document.getElementById('selectedInterests')
    };

    const savedProfile = localStorage.getItem('userProfile');

    // Инициализация приложения
    if (savedProfile) {
        showMainContent();
        updateProfileDisplay(JSON.parse(savedProfile));
    } else {
        showProfileSetup();
    }

    // Обработчики событий
    elements.editProfileBtn.addEventListener('click', () => {
        showProfileSetup(true);
        setupForm(true);
    });

    elements.photoInput.addEventListener('change', handlePhotoUpload);
    setupInterestsHandlers();
    setupFormSubmit();

    // Основные функции
    function showMainContent() {
        elements.profileSetup.style.display = 'none';
        elements.mainContent.style.display = 'block';
        elements.editProfileBtn.style.display = 'block';
        initializeSwiper();
    }

    function showProfileSetup(isEditing = false) {
        elements.mainContent.style.display = 'none';
        elements.profileSetup.style.display = 'block';
        elements.editProfileBtn.style.display = isEditing ? 'block' : 'none';
    }

    function setupForm(isEditing) {
        clearForm();
        if (isEditing && savedProfile) {
            const data = JSON.parse(savedProfile);
            fillFormWithData(data);
        }
    }

    function clearForm() {
        elements.form.reset();
        elements.interestsContainer.innerHTML = '';
        elements.selectedInterests.clear();
        document.querySelectorAll('.interest-btn').forEach(btn => btn.classList.remove('selected'));
    }

    function fillFormWithData(data) {
        Object.entries(data).forEach(([key, value]) => {
            if (key !== 'interests' && key !== 'photo') {
                const input = document.getElementById(key);
                if (input) input.value = value;
            }
        });

        if (data.photo) {
            elements.photoPreview.innerHTML = `<img src="${data.photo}" alt="Preview">`;
        }

        if (data.interests) {
            data.interests.forEach(interest => {
                const button = document.querySelector(`[data-interest="${interest}"]`);
                if (button) {
                    button.classList.add('selected');
                    elements.selectedInterests.add(interest);
                    addInterestTag(interest);
                }
            });
        }
    }

    function handlePhotoUpload(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = e => elements.photoPreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            reader.readAsDataURL(file);
        }
    }

    function setupFormSubmit() {
        elements.form.onsubmit = async (e) => {
            e.preventDefault();
            if (elements.selectedInterests.size < 3) {
                alert('Пожалуйста, выберите минимум 3 интереса');
                return false;
            }

            const formData = {
                photo: elements.photoPreview.querySelector('img')?.src || null,
                name: document.getElementById('name').value,
                age: parseInt(document.getElementById('age').value),
                city: document.getElementById('city').value,
                bio: document.getElementById('bio').value,
                interests: Array.from(elements.selectedInterests)
            };

            localStorage.setItem('userProfile', JSON.stringify(formData));
            updateProfileDisplay(formData);
            showMainContent();
            return false;
        };
    }

    function setupInterestsHandlers() {
        document.querySelectorAll('.interest-btn').forEach(button => {
            button.addEventListener('click', () => {
                const interest = button.dataset.interest;
                if (button.classList.contains('selected')) {
                    button.classList.remove('selected');
                    elements.selectedInterests.delete(interest);
                    removeInterestTag(interest);
                } else {
                    button.classList.add('selected');
                    elements.selectedInterests.add(interest);
                    addInterestTag(interest);
                }
                validateInterests();
            });
        });
    }

    // Вспомогательные функции для работы с интересами
    function addInterestTag(interest) {
        const tag = document.createElement('div');
        tag.className = 'selected-interest-tag';
        tag.innerHTML = `${interest}<button onclick="removeInterest('${interest}')"><i class="fas fa-times"></i></button>`;
        elements.interestsContainer.appendChild(tag);
    }

    function removeInterestTag(interest) {
        const tag = Array.from(elements.interestsContainer.getElementsByClassName('selected-interest-tag'))
            .find(tag => tag.textContent.trim() === interest);
        if (tag) tag.remove();
    }

    window.removeInterest = (interest) => {
        elements.selectedInterests.delete(interest);
        removeInterestTag(interest);
        document.querySelector(`[data-interest="${interest}"]`)?.classList.remove('selected');
        validateInterests();
    };

    function validateInterests() {
        const submitButton = document.querySelector('.btn-submit');
        const isValid = elements.selectedInterests.size >= 3;
        submitButton.disabled = !isValid;
        submitButton.style.opacity = isValid ? '1' : '0.5';
    }
});

function updateProfileDisplay(profileData) {
    // Обновляем отображаемые данные в карточке профиля
    const profileCard = document.querySelector('.profile-card');
    if (profileCard) {
        const photoContainer = profileCard.querySelector('.profile-photo');
        const infoContainer = profileCard.querySelector('.profile-info');

        // Обновляем фото
        photoContainer.innerHTML = `<img src="${profileData.photo || 'default-photo.jpg'}" alt="Profile Photo">`;

        // Обновляем информацию
        infoContainer.innerHTML = `
            <h2>${profileData.name}, ${profileData.age}</h2>
            <p class="location"><i class="fas fa-map-marker-alt"></i> ${profileData.city}</p>
            <p class="bio">${profileData.bio}</p>
        `;
    }
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
            // Сбрасываем все стили и индикаторы
            profileCard.style.transition = 'none';
            profileCard.style.transform = 'none';
            document.querySelector('.like-info').style.opacity = '0';
            document.querySelector('.nope-info').style.opacity = '0';
            moveX = 0; // Сбрасываем переменную перемещения
            
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
