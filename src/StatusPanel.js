import React from "react";

const ClockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const CalendarSmallIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

export const LabsList = ({ booths = [], selectedLab, onLabSelect }) => {
  const uniqueBooths = (booths || []).filter(
    (booth, index, self) =>
      index === self.findIndex((b) => b.name === booth.name)
  );

  return (
    <div className="booth-selection-panel">
      <h6 className="fw-semibold mb-3 text-slate-900 fs-7 text-uppercase" style={{ letterSpacing: "0.04em" }}>
        체험 부스 선택
      </h6>
      <div className="booth-pill-container d-flex flex-wrap gap-2">
        {uniqueBooths.map((booth) => {
          const isSelected = selectedLab === booth.name;
          return (
            <button
              key={booth.id || booth.name}
              type="button"
              className={`btn booth-taste-pill d-flex align-items-center gap-2 ${
                isSelected ? "active" : ""
              }`}
              onClick={() => onLabSelect(booth.name)}
            >
              <span
                className="booth-dot"
                style={{
                  backgroundColor: isSelected ? "#ffffff" : booth.color_tag || "#2563eb",
                }}
              />
              <span className="fw-medium">{booth.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const MyReservations = ({
  studentId,
  reservations = [],
  booths = [],
  currentReservationCount = 0,
  maxReservationsPerStudent = 2,
  onReservationClick,
}) => {
  const myReservations = studentId
    ? reservations
        .filter((r) => r.student_id === studentId)
        .sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return a.time_slot.localeCompare(b.time_slot);
        })
    : [];

  const maxCount = Number(maxReservationsPerStudent) || 2;
  const isAtLimit = currentReservationCount >= maxCount;

  const groupedReservations = myReservations.reduce((acc, res) => {
    if (!acc[res.date]) acc[res.date] = [];
    acc[res.date].push(res);
    return acc;
  }, {});

  return (
    <div className="taste-card p-4 mt-3">
      <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
        <h6 className="fw-semibold mb-0 text-slate-900 fs-7 text-uppercase" style={{ letterSpacing: "0.04em" }}>
          나의 예약 현황
        </h6>
        {studentId && (
          <span
            className={`taste-badge ${isAtLimit ? "taste-badge-danger" : "taste-badge-neutral"}`}
            style={{ fontWeight: 600, fontSize: "0.6875rem" }}
          >
            {currentReservationCount} / {maxCount}
          </span>
        )}
      </div>

      {!studentId ? (
        <div className="text-center py-4 bg-slate-50 rounded-2 border border-dashed">
          <p className="mb-1 text-xs text-slate-700 fw-medium">등록된 학번이 없습니다.</p>
          <span className="text-slate-400 text-xs">학번을 입력하면 신청 내역이 표시됩니다.</span>
        </div>
      ) : (
        <>
          {myReservations.length > 0 ? (
            <div className="d-flex flex-column gap-3">
              {Object.entries(groupedReservations).map(([date, resList]) => (
                <div key={date}>
                  <div className="text-xs fw-semibold text-slate-500 mb-1.5 px-1 d-flex align-items-center gap-1.5 font-mono">
                    <CalendarSmallIcon />
                    <span>{date}</span>
                  </div>
                  <div className="d-flex flex-column gap-2">
                    {resList.map((reservation) => {
                      const matchedBooth = booths.find((b) => b.name === reservation.booth_id);
                      const boothColor = matchedBooth?.color_tag || "#2563eb";

                      return (
                        <div
                          key={reservation.id}
                          className="reservation-item-row p-2.5 border rounded-2 d-flex justify-content-between align-items-center bg-white"
                          onClick={() => onReservationClick(reservation)}
                          style={{ cursor: "pointer", transition: "all 0.15s ease" }}
                        >
                          <div className="overflow-hidden me-2">
                            <div className="d-flex align-items-center gap-1.5 mb-1">
                              <span
                                style={{
                                  width: "6px",
                                  height: "6px",
                                  borderRadius: "50%",
                                  backgroundColor: boothColor,
                                  flexShrink: 0,
                                }}
                              />
                              <span className="fw-medium text-slate-900 text-truncate text-sm">
                                {reservation.booth_id}
                              </span>
                            </div>
                            <div className="d-flex align-items-center gap-2 text-xs text-slate-500 font-mono">
                              <span className="d-flex align-items-center gap-1">
                                <ClockIcon />
                                <span>{reservation.time_slot}</span>
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-taste-outline-danger shrink-0 px-2 py-1 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              onReservationClick(reservation);
                            }}
                          >
                            취소
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="pt-2 border-top">
                <span className="text-slate-400 text-xs d-block text-center" style={{ fontSize: "0.6875rem" }}>
                  행사 당일 부스 입장 시 위 예약 내역을 확인합니다.
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 bg-slate-50 rounded-2 text-xs text-slate-500 border border-dashed">
              신청한 예약 내역이 없습니다.
            </div>
          )}
        </>
      )}
    </div>
  );
};
