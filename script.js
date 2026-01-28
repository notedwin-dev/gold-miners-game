document.addEventListener('DOMContentLoaded', function () {
  // 游戏状态 - 初始钻石设置为10000
  let diamonds = 10000;
  const diamondElement = document.getElementById('diamond-count');
  const resultArea = document.getElementById('result-area');
  const historyList = document.getElementById('history-list');
  const nuggets = document.querySelectorAll('.gold-nugget');
  const popup = document.getElementById('results-popup');
  const popupClose = document.getElementById('popup-close');

  // 使用dino倍率
    const multipliers = [
    { value: 0.05, prob: 38.80, reward: 5 },
    { value: 0.5, prob: 45.88, reward: 50 },
    { value: 0.8, prob: 10.74, reward: 80 },
    { value: 5, prob: 2.18, reward: 500 },
    { value: 10, prob: 1.19, reward: 1000 },
    { value: 25, prob: 0.91, reward: 2500 },
    { value: 50, prob: 0.20, reward: 5000 },
    { value: 100, prob: 0.10, reward: 10000 }
  ];

  // 外圈格子的顺时针顺序
  const outerCellsOrder = [
    'cell-1', 'cell-2', 'cell-3',
    'cell-6', 'cell-9', 'cell-8',
    'cell-7', 'cell-4'
  ];

  // 倍率到格子ID的映射
  const multiplierToCellId = {
    0.05: 'cell-1',
    100: 'cell-2',
    0.5: 'cell-3',
    50: 'cell-4',
    10: 'cell-6',
    5: 'cell-7',
    25: 'cell-8',
    0.8: 'cell-9'
  };

  // 创建背景粒子
  function createParticles() {
    const container = document.querySelector('.particles-container');
    for (let i = 0; i < 30; i++) {
      const particle = document.createElement('div');
      particle.className = 'gold-particle';
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      particle.style.animation = `floatUp ${Math.random() * 10 + 5}s linear infinite`;
      particle.style.animationDelay = `${Math.random() * 5}s`;
      particle.style.opacity = Math.random() * 0.5 + 0.1;
      particle.style.width = `${Math.random() * 8 + 4}px`;
      particle.style.height = particle.style.width;
      container.appendChild(particle);
    }
  }

  // 更新钻石显示
  function updateDiamondDisplay() {
    diamondElement.textContent = diamonds;
  }

  // 显示浮动奖励文字
  function showFloatingReward(reward, x, y) {
    const floating = document.createElement('div');
    floating.className = 'floating-reward';
    floating.textContent = `+${reward}钻石`;
    floating.style.left = `${x}px`;
    floating.style.top = `${y}px`;
    document.body.appendChild(floating);

    setTimeout(() => {
      floating.remove();
    }, 1800);
  }

  // 金矿动画
  function animateNugget(nugget) {
    nugget.style.animation = 'nuggetGlow 0.5s 3';
    setTimeout(() => {
      nugget.style.animation = '';
    }, 1500);
  }

  // 高亮格子
  function highlightCell(cellId, highlight) {
    const cell = document.getElementById(cellId);
    if (cell) {
      if (highlight) {
        cell.classList.add('highlight');
        cell.style.animation = 'highlightFlash 0.8s infinite';
      } else {
        cell.classList.remove('highlight');
        cell.style.animation = '';
      }
    }
  }

  // 顺时针旋转高亮效果，停在目标位置
  function spinHighlight(duration, targetCellId, callback) {
    const baseLaps = 3; // 基础旋转圈数
    const targetIndex = outerCellsOrder.indexOf(targetCellId);
    const totalSteps = baseLaps * outerCellsOrder.length + targetIndex;
    const intervalTime = duration / totalSteps;
    let currentStep = 0;
    let currentIndex = 0;

    // 清除所有高亮
    outerCellsOrder.forEach(cellId => highlightCell(cellId, false));

    const interval = setInterval(() => {
      // 清除上一个高亮
      highlightCell(outerCellsOrder[currentIndex], false);

      // 移动到下一个格子
      currentIndex = (currentIndex + 1) % outerCellsOrder.length;

      // 高亮当前格子
      highlightCell(outerCellsOrder[currentIndex], true);

      currentStep++;

      if (currentStep >= totalSteps) {
        clearInterval(interval);
        // 确保最后停在目标格子上
        highlightCell(targetCellId, true);
        setTimeout(() => {
          highlightCell(targetCellId, false);
          if (callback) callback();
        }, 500);
      }
    }, intervalTime);
  }

  // 根据概率随机选择奖励
  function getRandomReward() {
    const rand = Math.random() * 100;
    let cumulativeProb = 0;

    for (const multiplier of multipliers) {
      cumulativeProb += multiplier.prob;
      if (rand <= cumulativeProb) {
        return multiplier;
      }
    }

    // 默认返回最低奖励
    return multipliers[0];
  }

  // 显示结果弹窗
  function showResultsPopup(times, rewards, totalReward) {
    const cost = 100 * times;
    const net = totalReward - cost;

    // 更新摘要信息
    document.getElementById('summary-count').textContent = times;
    document.getElementById('summary-cost').textContent = `${cost} 钻石`;
    document.getElementById('summary-reward').textContent = `${totalReward} 钻石`;
    document.getElementById('summary-net').textContent = `${net} 钻石`;
    document.getElementById('summary-net').style.color = net >= 0 ? '#4CAF50' : '#F44336';

    // 更新标题
    document.getElementById('popup-title').textContent =
      times === 1 ? '挖矿结果' : `挖矿结果 (${times}次)`;

    // 清空并填充详细结果网格
    const resultsGrid = document.getElementById('results-grid');
    resultsGrid.innerHTML = '';

    // 统计每种倍数的出现次数
    const rewardStats = {};
    rewards.forEach(reward => {
      if (!rewardStats[reward.value]) {
        rewardStats[reward.value] = 0;
      }
      rewardStats[reward.value]++;
    });

    // 按倍数从高到低排序
    const sortedMultipliers = Object.keys(rewardStats).sort((a, b) => b - a);

    // 为每种倍数创建结果项
    sortedMultipliers.forEach(multiplier => {
      const count = rewardStats[multiplier];
      const rewardInfo = multipliers.find(m => m.value == multiplier);

      const resultItem = document.createElement('div');
      resultItem.className = 'result-item';
      resultItem.innerHTML = `
                        <div class="result-nugget">x${multiplier}</div>
                        <div class="result-count">${count}次 (${rewardInfo.reward * count}钻石)</div>
                    `;

      resultsGrid.appendChild(resultItem);
    });

    // 显示弹窗
    popup.classList.add('active');
  }

  // 挖矿函数
  function mineGold(times) {
    const cost = 100 * times;

    // 检查钻石是否足够
    if (diamonds < cost) {
      resultArea.innerHTML = '<div class="result-text">钻石不足！</div><div class="reward-text">请获取更多钻石</div>';
      return;
    }

    // 扣除钻石
    diamonds -= cost;
    updateDiamondDisplay();

    // 显示挖矿中状态
    resultArea.innerHTML = '<div class="result-text">挖矿中...</div>';

    // 获取所有挖矿结果
    let totalReward = 0;
    let rewards = [];
    let lastReward = null;

    for (let i = 0; i < times; i++) {
      const reward = getRandomReward();
      rewards.push(reward);
      totalReward += reward.reward;
      lastReward = reward;
    }

    // 获取最后一次奖励对应的格子ID
    const targetCellId = multiplierToCellId[lastReward.value];

    // 开始旋转动画，停在目标位置
    spinHighlight(1800, targetCellId, () => {
      // 添加奖励到钻石
      diamonds += totalReward;
      updateDiamondDisplay();

      // 添加历史记录
      rewards.forEach(reward => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `<span>挖到 <span class="multiplier">x${reward.value}</span> 倍金矿</span> <span>获得 <span class="reward">${reward.reward}钻石</span></span>`;

        // 保持最多10条历史记录
        if (historyList.children.length >= 10) {
          historyList.removeChild(historyList.lastChild);
        }
        historyList.prepend(historyItem);
      });

      // 显示结果
      if (times === 1) {
        resultArea.innerHTML = `
                            <div class="result-text">挖到 x${lastReward.value} 倍金矿！</div>
                            <div class="reward-text">获得 ${lastReward.reward} 钻石</div>
                        `;

        // 显示浮动奖励
        const nugget = Array.from(nuggets).find(
          n => parseFloat(n.dataset.multiplier) === lastReward.value
        );
        if (nugget) {
          const rect = nugget.getBoundingClientRect();
          const x = rect.left + rect.width / 2;
          const y = rect.top + rect.height / 2;
          showFloatingReward(lastReward.reward, x, y);
        }
      } else {
        resultArea.innerHTML = `
                            <div class="result-text">完成 ${times} 次挖矿！</div>
                            <div class="reward-text">总共获得 ${totalReward} 钻石</div>
                            <div class="reward-text">最后一次: x${lastReward.value} 倍，获得 ${lastReward.reward} 钻石</div>
                        `;

        // 在中间显示浮动奖励
        const gridRect = document.getElementById('mine-grid').getBoundingClientRect();
        const x = gridRect.left + gridRect.width / 2;
        const y = gridRect.top + gridRect.height / 2;
        showFloatingReward(totalReward, x, y);
      }

      // 高亮目标金矿
      const targetNugget = Array.from(nuggets).find(
        n => parseFloat(n.dataset.multiplier) === lastReward.value
      );
      if (targetNugget) {
        animateNugget(targetNugget);
      }

      // 显示结果弹窗
      showResultsPopup(times, rewards, totalReward);
    });
  }

  // 为金矿添加点击事件查看信息
  nuggets.forEach(nugget => {
    nugget.addEventListener('click', () => {
      const multiplier = parseFloat(nugget.dataset.multiplier);
      const multiplierInfo = multipliers.find(m => m.value === multiplier);

      if (multiplierInfo) {
        resultArea.innerHTML = `
                            <div class="result-text">x${multiplier} 倍金矿</div>
                            <div class="reward-text">奖励: ${multiplierInfo.reward}钻石</div>
                            <div class="reward-text">概率: ${multiplierInfo.prob}%</div>
                        `;

        animateNugget(nugget);
      }
    });
  });

  // 挖矿按钮事件监听
  document.getElementById('mine-1').addEventListener('click', () => mineGold(1));
  document.getElementById('mine-10').addEventListener('click', () => mineGold(10));
  document.getElementById('mine-100').addEventListener('click', () => mineGold(100));

  // 关闭弹窗按钮
  popupClose.addEventListener('click', function (e) {
    e.stopPropagation(); // 阻止事件冒泡
    popup.classList.remove('active');
  });

  // 点击弹窗外部关闭
  popup.addEventListener('click', function (e) {
    if (e.target === popup) {
      popup.classList.remove('active');
    }
  });

  // 初始化游戏
  createParticles();
  updateDiamondDisplay();
});