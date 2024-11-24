document.addEventListener('DOMContentLoaded', () => {
  const slider = document.getElementById('speed-slider');
  const sliderValue = document.querySelector('.slider-value');
  const presetButtons = document.querySelectorAll('.preset-speed');

  // 更新显示的速度值
  function updateSpeedDisplay(speed) {
    sliderValue.textContent = `${speed}x`;
  }

  // 设置视频速度
  function setVideoSpeed(speed) {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'setSpeed',
        speed: speed
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('发送消息失败:', chrome.runtime.lastError);
        }
      });
    });
  }

  // 滑块事件监听
  slider.addEventListener('input', () => {
    const speed = parseFloat(slider.value);
    updateSpeedDisplay(speed);
    setVideoSpeed(speed);
  });

  // 预设按钮事件监听
  presetButtons.forEach(button => {
    button.addEventListener('click', () => {
      const speed = parseFloat(button.dataset.speed);
      slider.value = speed;
      updateSpeedDisplay(speed);
      setVideoSpeed(speed);
    });
  });
}); 