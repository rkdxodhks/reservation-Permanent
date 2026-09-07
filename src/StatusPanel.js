import React from "react";

const ClockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const CalendarSmallIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
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
      <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
        <h6 className="fw-semibold mb-0 text-slate-900 fs-7 text-uppercase" style={{ letterSpacing: "0.04em" }}>
          체험 부스 선택
        </h6>
        <span className="text-slate-400" style={{ fontSize: "0.6875rem" }}>
          총 {uniqueBooths.length}개
        </span>
      </div>
      <div className="booth-pill-container d-flex flex-wrap gap-2">
        {uniqueBooths.map((booth) => {
          const isSelected = selectedLab === booth.name;
          return (
            <button
              key={booth.id || booth.name}
              type="button"
              className={`btn booth-taste-pill d-flex align-items-center gap-2 py-2 px-3 ${
                isSelected ? "active" : ""
              }`}
              onClick={() => onLabSelect(booth.name)}
            >
              <span
                className="booth-dot"
                style={{
                  backgroundColor: isSelected ? "#ffffff" : booth.color_tag || "#2563eb",
                  width: "7px",
                  height: "7px",
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
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom">
        <h6 className="fw-semibold mb-0 text-slate-900 fs-7 text-uppercase" style={{ letterSpacing: "0.04em" }}>
          나의 예약 현황
        </h6>
        {studentId && (
          <span
            className={`taste-badge ${isAtLimit ? "taste-badge-danger" : "taste-badge-neutral"}`}
            style={{ fontWeight: 600, fontSize: "0.75rem", padding: "4px 10px", borderRadius: "6px" }}
          >
            {currentReservationCount} / {maxCount}
          </span>
        )}
      </div>

      {!studentId ? (
        <div className="text-center py-5 bg-slate-50 rounded-3 border border-dashed my-2">
          <p className="mb-1 text-sm text-slate-700 fw-medium">등록된 학번이 없습니다.</p>
          <span className="text-slate-400 text-xs">학번을 입력하시면 예약 내역이 표시됩니다.</span>
        </div>
      ) : (
        <>
          {myReservations.length > 0 ? (
            <div className="d-flex flex-column gap-4">
              {Object.entries(groupedReservations).map(([date, resList]) => (
                <div key={date}>
                  {/* Date Header with spacious margin */}
                  <div className="text-xs fw-semibold text-slate-500 mb-2.5 px-1 d-flex align-items-center gap-2 font-mono">
                    <CalendarSmallIcon />
                    <span>{date}</span>
                  </div>

                  {/* Reservation items with spacious padding */}
                  <div className="d-flex flex-column gap-2.5">
                    {resList.map((reservation) => {
                      const matchedBooth = booths.find((b) => b.name === reservation.booth_id);
                      const boothColor = matchedBooth?.color_tag || "#2563eb";

                      return (
                        <div
                          key={reservation.id}
                          className="reservation-item-row border rounded-2 d-flex justify-content-between align-items-center bg-white"
                          onClick={() => onReservationClick(reservation)}
                          style={{
                            cursor: "pointer",
                            padding: "14px 16px",
                            transition: "all 0.15s ease",
                            borderColor: "var(--slate-200)",
                          }}
                        >
                          <div className="overflow-hidden me-3 flex-grow-1" style={{ minWidth: 0 }}>
                            {/* Booth Title with color dot and good space */}
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <span
                                style={{
                                  width: "7px",
                                  height: "7px",
                                  borderRadius: "50%",
                                  backgroundColor: boothColor,
                                  flexShrink: 0,
                                }}
                              />
                              <span className="fw-semibold text-slate-900 text-truncate" style={{ fontSize: "0.875rem" }}>
                                {reservation.booth_id}
                              </span>
                            </div>

                            {/* Time Slot with spacious font-mono badge */}
                            <div className="d-flex align-items-center gap-2 text-xs text-slate-500 font-mono">
                              <span className="d-flex align-items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                <ClockIcon />
                                <span className="fw-medium text-slate-700">{reservation.time_slot}</span>
                              </span>
                            </div>
                          </div>

                          {/* Cancel button with guaranteed horizontal layout & comfortable hit-target */}
                          <button
                            type="button"
                            className="btn btn-taste-outline-danger flex-shrink-0 px-3 py-1.5 text-xs fw-medium"
                            style={{
                              whiteSpace: "nowrap",
                              wordBreak: "keep-all",
                              flexShrink: 0,
                              minWidth: "54px",
                            }}
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

              {/* Bottom notice with generous padding */}
              <div className="pt-3 mt-1 border-top text-center">
                <span className="text-slate-400 text-xs d-block" style={{ fontSize: "0.75rem", lineHeight: "1.5" }}>
                  행사 당일 부스 입장 시 위 예약 내역을 확인합니다.
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-5 bg-slate-50 rounded-3 text-xs text-slate-500 border border-dashed my-2">
              신청한 예약 내역이 없습니다.
            </div>
          )}
        </>
      )}
    </div>
  );
};
