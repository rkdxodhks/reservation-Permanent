import React from "react";

export const LabsList = ({ booths = [], selectedLab, onLabSelect }) => {
  // Deduplicate booths by name to ensure no duplicate buttons appear in UI
  const uniqueBooths = (booths || []).filter(
    (booth, index, self) =>
      index === self.findIndex((b) => b.name === booth.name)
  );

  return (
    <div className="booth-selection-panel">
      <h6 className="fw-semibold mb-3 text-slate-900">
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
  // Show ALL reservations for this student across all dates, sorted by date and time
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

  // Group by date
  const groupedReservations = myReservations.reduce((acc, res) => {
    if (!acc[res.date]) acc[res.date] = [];
    acc[res.date].push(res);
    return acc;
  }, {});

  return (
    <div className="taste-card p-4 mt-3">
      <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
        <h6 className="fw-semibold mb-0 text-slate-900 d-flex align-items-center gap-2">
          <span>나의 예약 현황</span>
        </h6>
        {studentId && (
          <span
            className={`taste-badge ${isAtLimit ? "taste-badge-danger" : "taste-badge-primary"}`}
            style={{ fontWeight: 600, fontSize: "0.75rem" }}
          >
            {currentReservationCount} / {maxCount} 회
          </span>
        )}
      </div>

      {!studentId ? (
        <div className="text-center py-4 text-slate-500 bg-slate-50 rounded-3 border border-dashed">
          <small className="d-block mb-1 font-medium text-slate-700">등록된 학번이 없습니다.</small>
          <small className="text-slate-500 text-xs">학번을 입력하면 신청한 예약 내역이 표시됩니다.</small>
        </div>
      ) : (
        <>
          {myReservations.length > 0 ? (
            <div className="d-flex flex-column gap-3">
              {Object.entries(groupedReservations).map(([date, resList]) => (
                <div key={date}>
                  <div className="text-xs fw-semibold text-slate-600 mb-2 px-1 d-flex align-items-center gap-1.5">
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#3b82f6" }} />
                    <span>{date}</span>
                  </div>
                  <div className="d-flex flex-column gap-2">
                    {resList.map((reservation) => {
                      const matchedBooth = booths.find((b) => b.name === reservation.booth_id);
                      const boothColor = matchedBooth?.color_tag || "#2563eb";

                      return (
                        <div
                          key={reservation.id}
                          className="reservation-ticket-card d-flex justify-content-between align-items-center"
                          onClick={() => onReservationClick(reservation)}
                          style={{ cursor: "pointer", borderLeft: `3px solid ${boothColor}` }}
                          title="클릭하여 예약 상세 확인 및 취소"
                        >
                          <div className="overflow-hidden me-2">
                            <div className="d-flex align-items-center gap-1.5 mb-1">
                              <span
                                style={{
                                  width: "7px",
                                  height: "7px",
                                  borderRadius: "50%",
                                  backgroundColor: boothColor,
                                  flexShrink: 0,
                                }}
                              />
                              <span className="fw-semibold text-slate-900 text-truncate text-sm">
                                {reservation.booth_id}
                              </span>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                              <span className="badge bg-slate-100 text-slate-700 font-mono text-xs px-2 py-0.5 rounded">
                                {reservation.time_slot}
                              </span>
                              <span className="text-slate-500 text-xs">
                                본인 신청
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-taste-outline-danger btn-sm shrink-0 px-2.5 py-1 text-xs"
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

              <div className="bg-blue-50 p-2.5 rounded-2 border border-blue-100 text-center mt-1">
                <small className="text-slate-700 text-xs">
                  💡 행사 당일 부스 입장 시 위 예약 내역을 제시해 주세요.
                </small>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-slate-500 bg-slate-50 rounded-3 text-sm border border-dashed">
              신청한 예약 내역이 없습니다.
            </div>
          )}
        </>
      )}
    </div>
  );
};
