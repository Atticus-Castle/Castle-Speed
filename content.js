// 创建一个全局变量来存储当前速度
let currentSpeed = 1.0;

// 直接修改视频速度的函数
function setVideoSpeed(speed) {
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
        try {
            // 移除之前的事件监听器以避免重复
            video.removeEventListener('ratechange', video._speedHandler);
            
            // 优化播放性能
            if (video.mozPreservesPitch !== undefined) { // Firefox
                video.mozPreservesPitch = false;
            }
            if (video.preservesPitch !== undefined) { // Chrome
                video.preservesPitch = false;
            }

            // 针对高速播放的优化
            if (speed > 4) {
                // 对高速播放进行额外优化
                video.style.cssText += `
                    transform: scale(0.9999);
                    will-change: transform;
                    -webkit-transform: translateZ(0);
                    -webkit-backface-visibility: hidden;
                    -webkit-perspective: 1000;
                `;
                
                // 降低视频质量以提高性能
                if (video.videoHeight > 720) {
                    video.style.cssText += 'transform: scale(0.75);';
                }
            } else {
                // 正常速度下的设置
                if (video.videoHeight > 720) {
                    video.style.cssText += 'transform: scale(0.9999); will-change: transform;';
                }
            }

            // 设置新的播放速度
            video.playbackRate = speed;
            
            // 创建新的事件处理器
            video._speedHandler = function() {
                if (this.playbackRate !== speed) {
                    this.playbackRate = speed;
                }
            };
            
            // 添加事件监听器
            video.addEventListener('ratechange', video._speedHandler);
            
            // 优化播放缓冲
            if ('mediaSource' in window) {
                try {
                    if (video.buffered.length) {
                        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
                        if (bufferedEnd < video.duration) {
                            video.currentTime = Math.max(video.currentTime, video.buffered.start(0));
                        }
                    }
                } catch (e) {
                    console.log('Buffer optimization failed:', e);
                }
            }

        } catch(e) {
            console.error('设置视频速度失败:', e);
        }
    });
}

// 优化的视频检查函数
function checkForVideos() {
    requestAnimationFrame(() => {
        const videos = document.querySelectorAll('video');
        if (videos.length > 0) {
            videos.forEach(video => {
                if (!video._speedInitialized) {
                    video._speedInitialized = true;
                    setVideoSpeed(currentSpeed);
                }
            });
        }
    });
}

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'setSpeed') {
        currentSpeed = request.speed;
        setVideoSpeed(currentSpeed);
        sendResponse({success: true});
    }
});

// 初始化
setVideoSpeed(currentSpeed);

// 优化的检查间隔
let checkInterval = setInterval(checkForVideos, 1000);

// 使用 MutationObserver 监听 DOM 变化
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
            checkForVideos();
        }
    });
});

// 配置观察器选项
const observerConfig = {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src']
};

// 开始观察
observer.observe(document.documentElement, observerConfig);

// 注入优化的样式
const style = document.createElement('style');
style.textContent = `
    video {
        transition: playbackRate 0.1s linear !important;
        backface-visibility: hidden !important;
        -webkit-backface-visibility: hidden !important;
    }
    video::-webkit-media-controls-timeline-container,
    video::-webkit-media-controls-timeline {
        pointer-events: auto !important;
    }
`;
document.head.appendChild(style);

// 页面可见性变化时重新应用速度设置
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        setVideoSpeed(currentSpeed);
    }
});

// 键盘快捷键
document.addEventListener('keydown', (e) => {
    if (e.altKey) {
        switch(e.key) {
            case 'ArrowUp':
                currentSpeed = Math.min(currentSpeed + 0.25, 16);
                setVideoSpeed(currentSpeed);
                break;
            case 'ArrowDown':
                currentSpeed = Math.max(currentSpeed - 0.25, 0.25);
                setVideoSpeed(currentSpeed);
                break;
            case 'r':
                currentSpeed = 1;
                setVideoSpeed(currentSpeed);
                break;
        }
    }
});

// 清理函数
window.addEventListener('beforeunload', () => {
    clearInterval(checkInterval);
    observer.disconnect();
}); 