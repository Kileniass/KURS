document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Wait for tgApp initialization
        async function waitForTgApp(timeout = 10000) {
            return new Promise((resolve, reject) => {
                const startTime = Date.now();
                
                const check = () => {
                    if (window.tgApp) {
                        resolve(window.tgApp);
                    } else if (Date.now() - startTime >= timeout) {
                        reject(new Error('Timeout waiting for tgApp'));
                    } else {
                        setTimeout(check, 100);
                    }
                };
                
                check();
            });
        }

        // Get tgApp instance
        const tgApp = await waitForTgApp();
        console.log('tgApp obtained');

        // Wait for full initialization
        await tgApp.initPromise;
        console.log('tgApp fully initialized');

        // Generate or retrieve device ID
        let deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
            deviceId = crypto.randomUUID();
            localStorage.setItem('deviceId', deviceId);
        }
        console.log('Using device ID:', deviceId);

        // Initialize user profile
        try {
            // Инициализируем пользователя с deviceId
            const initResponse = await tgApp.api.initUser(deviceId);
            console.log('User initialized:', initResponse);

            // Получаем профиль
            const profile = await tgApp.api.getProfile();
            console.log('User profile:', profile);

            if (!profile) {
                // Если профиль не существует, перенаправляем на страницу создания профиля
                window.location.href = '/profile-change.html';
                return;
            }
        } catch (error) {
            console.error('Error initializing user:', error);
            showError('Failed to initialize user profile');
            return;
        }

        // Load next profile
        try {
            const nextProfile = await tgApp.api.getNextProfile();
            if (nextProfile) {
                displayProfile(nextProfile);
            } else {
                displayNoMoreProfiles();
            }
        } catch (error) {
            console.error('Error loading next profile:', error);
            showError('Failed to load next profile');
            return;
        }

        // Add event listeners for like/dislike buttons
        document.getElementById('likeButton').addEventListener('click', async () => {
            try {
                const currentProfile = document.querySelector('.profile-card').dataset.profileId;
                const result = await tgApp.api.likeProfile(currentProfile);
                
                if (result.match) {
                    showMatchNotification();
                }
                
                const nextProfile = await tgApp.api.getNextProfile();
                if (nextProfile) {
                    displayProfile(nextProfile);
                } else {
                    displayNoMoreProfiles();
                }
            } catch (error) {
                console.error('Error processing like:', error);
                showError('Failed to process like');
            }
        });

        document.getElementById('dislikeButton').addEventListener('click', async () => {
            try {
                const currentProfile = document.querySelector('.profile-card').dataset.profileId;
                await tgApp.api.dislikeProfile(currentProfile);
                
                const nextProfile = await tgApp.api.getNextProfile();
                if (nextProfile) {
                    displayProfile(nextProfile);
                } else {
                    displayNoMoreProfiles();
                }
            } catch (error) {
                console.error('Error processing dislike:', error);
                showError('Failed to process dislike');
            }
        });

    } catch (error) {
        console.error('Initialization error:', error);
        showError('Failed to initialize application');
    }
});

function displayProfile(profile) {
    const profileCard = document.querySelector('.profile-card');
    profileCard.dataset.profileId = profile.id;
    
    document.getElementById('profileName').textContent = profile.name;
    document.getElementById('profileAge').textContent = profile.age;
    
    if (profile.car) {
        document.getElementById('profileCar').textContent = profile.car;
        document.getElementById('carSection').style.display = 'block';
    } else {
        document.getElementById('carSection').style.display = 'none';
    }
    
    if (profile.region) {
        document.getElementById('profileRegion').textContent = profile.region;
        document.getElementById('regionSection').style.display = 'block';
    } else {
        document.getElementById('regionSection').style.display = 'none';
    }
    
    if (profile.about) {
        document.getElementById('profileAbout').textContent = profile.about;
        document.getElementById('aboutSection').style.display = 'block';
    } else {
        document.getElementById('aboutSection').style.display = 'none';
    }
    
    const profileImage = document.getElementById('profileImage');
    if (profile.photo_url) {
        profileImage.src = profile.photo_url;
        profileImage.alt = `${profile.name}'s photo`;
    } else {
        profileImage.src = 'images/default-profile.jpg';
        profileImage.alt = 'Default profile photo';
    }
}

function displayNoMoreProfiles() {
    const profileCard = document.querySelector('.profile-card');
    profileCard.innerHTML = `
        <div class="no-profiles">
            <h2>No more profiles</h2>
            <p>Check back later for new matches!</p>
        </div>
    `;
    document.getElementById('likeButton').disabled = true;
    document.getElementById('dislikeButton').disabled = true;
}

function showMatchNotification() {
    const notification = document.createElement('div');
    notification.className = 'match-notification';
    notification.innerHTML = `
        <div class="match-content">
            <h3>It's a match! 🎉</h3>
            <p>You can now chat with this person</p>
            <button onclick="this.parentElement.parentElement.remove()">OK</button>
        </div>
    `;
    document.body.appendChild(notification);
}

function showError(message) {
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.innerHTML = `
        <div class="error-content">
            <h3>Error</h3>
            <p>${message}</p>
            <button onclick="this.parentElement.parentElement.remove()">OK</button>
        </div>
    `;
    document.body.appendChild(notification);
} 