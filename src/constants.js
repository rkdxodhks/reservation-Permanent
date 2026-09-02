export const DEFAULT_SETTINGS = {
  event_title: "연구실 체험부스 실시간 예약 시스템",
  event_dates: ["2026-09-10", "2026-09-11"],
  max_reservations_per_student: 2,
  max_capacity_per_slot: 2,
  start_time: "10:00",
  end_time: "16:00",
  slot_interval: 20,
  admin_passcode: "admin1234",
};

export const DEFAULT_BOOTHS = [
  {
    id: 1,
    name: "전임상의약실험실",
    description: "의약품 임상 및 전임상 관련 연구 체험",
    color_tag: "#3b82f6",
    display_order: 1,
  },
  {
    id: 2,
    name: "생체소재 및 대사질환실험실",
    description: "생체재료 및 대사 질환 모델 탐구",
    color_tag: "#10b981",
    display_order: 2,
  },
  {
    id: 3,
    name: "고분자약물전달실험실",
    description: "약물 전달 체계 및 나노 입자 관찰",
    color_tag: "#8b5cf6",
    display_order: 3,
  },
  {
    id: 4,
    name: "고분자콜로이드실험실",
    description: "콜로이드 화학 및 계면 현상 체험",
    color_tag: "#f59e0b",
    display_order: 4,
  },
  {
    id: 5,
    name: "나노인공세포공학실험실",
    description: "인공 세포 및 나노 기술 응용 실험",
    color_tag: "#ec4899",
    display_order: 5,
  },
  {
    id: 6,
    name: "바이오의약소재실험실",
    description: "바이오 의약품 소재 및 분석실험",
    color_tag: "#06b6d4",
    display_order: 6,
  },
];

/**
 * 동적 타임슬롯 생성 헬퍼 함수
 * @param {string} startTime 시작 시간 (예: "10:00")
 * @param {string} endTime 종료 시간 (예: "16:00")
 * @param {number} intervalMinutes 시간 간격 (분 단위, 예: 20)
 * @returns {Array<string>} 생성된 타임슬롯 스트링 배열
 */
export const generateTimeSlots = (
  startTime = "10:00",
  endTime = "16:00",
  intervalMinutes = 20
) => {
  const slots = [];
  try {
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);

    let currentMinutes = startH * 60 + startM;
    const endMinutesTotal = endH * 60 + endM;

    while (currentMinutes < endMinutesTotal) {
      const hour = Math.floor(currentMinutes / 60);
      const minute = currentMinutes % 60;

      // 12:00 ~ 13:40 (점심시간 예외 처리 옵션 - 12:00 ~ 13:00 구간 제외 가능)
      // 표준 24시간 표기
      const timeStr = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      
      slots.push(timeStr);
      currentMinutes += Number(intervalMinutes);
    }
  } catch (err) {
    console.error("Error generating time slots:", err);
    // 기본 슬롯 롤백
    return [
      "10:00", "10:20", "10:40", "11:00", "11:20", "11:40",
      "14:00", "14:20", "14:40", "15:00", "15:20", "15:40"
    ];
  }

  return slots.length > 0
    ? slots
    : [
        "10:00", "10:20", "10:40", "11:00", "11:20", "11:40",
        "14:00", "14:20", "14:40", "15:00", "15:20", "15:40"
      ];
};

export const LABS = DEFAULT_BOOTHS.map((b) => b.name);
export const MAX_RESERVATIONS_PER_SLOT = 2;
