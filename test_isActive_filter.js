// isActive 필터링 테스트
const bots = [
  { id: 1, name: "Bot 1", isActive: 1 },
  { id: 2, name: "Bot 2", isActive: 0 },
  { id: 3, name: "Bot 3", isActive: 1 }
];

console.log("원본 봇:", bots);

const activeBots = bots.filter(bot => bot.isActive);
console.log("필터된 활성 봇:", activeBots);
console.log("활성 봇 개수:", activeBots.length);

// isActive가 1일 때 truthy 값인지 확인
console.log("1 is truthy:", !!1);
console.log("0 is truthy:", !!0);
