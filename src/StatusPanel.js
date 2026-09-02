import React from "react";

export const LabsList = ({ booths = [], selectedLab, onLabSelect }) => (
  <div className="booth-selection-panel mb-4">
    <h5 className="fw-bold mb-3 text-dark d-flex align-items-center gap-2">
      <span>🧪 체험 부스 선택</span>
    </h5>
    <div className="booth-pill-container d-flex flex-wrap gap-2">
      {booths.map((booth) => {
        const isSelected = selectedLab === booth.name;
        return (
          <button
            key={booth.id || booth.name}
            type="button"
            className={`btn booth-pill-btn d-flex align-items-center gap-2 ${
              isSelected ? "active shadow-sm" : "btn-light border"
            }`}
            style={{
              borderColor: isSelected ? booth.color_tag || "#3b82f6" : "#e2e8f0",
              backgroundColor: isSelected ? booth.color_tag || "#3b82f6" : "#ffffff",
              color: isSelected ? "#ffffff" : "#1e293b",
            }}
            onClick={() => onLabSelect(booth.name)}
          >
            <span
              className="booth-color-dot"
              style={{
                backgroundColor: isSelected ? "#ffffff" : booth.color_tag || "#3b82f6",
              }}
            />
            <span className="fw-medium">{booth.name}</span>
          </button>
        );
      })}
    </div>
  </div>
);

export const MyReservations = ({
  studentId,
  reservationsByDate = {},
  currentReservationCount = 0,
  maxReservationsPerStudent = 2,
  onReservationClick,
}) => {
  // Combine all dates reservations for this student
  const allReservations = Object.values(reservationsByDate).flat();
  const myReservations = studentId
    ? allReservations.filter((r) => r.student_id === studentId)
    : [];

  return (
    <div className="my-reservations-card bg-white p-3 rounded shadow-sm border mt-3">
      <h6 className="fw-bold mb-3 text-dark d-flex align-items-center justify-content-between">
        <span>📑 나의 예약 현황</span>
        {studentId && (
          <span
            className={`badge ${
              currentReservationCount >= maxReservationsPerStudent
                ? "bg-danger"
                : "bg-primary"
            }`}
          >
            {currentReservationCount} / {maxReservationsPerStudent} 회
          </span>
        )}
      </h6>

      {!studentId ? (
        <div className="text-center py-3 text-muted bg-light rounded border border-dashed">
          <small>학번을 입력하면 나의 예약 내역이 표시됩니다.</small>
        </div>
      ) : (
        <>
          {myReservations.length > 0 ? (
            <div className="d-flex flex-column gap-2">
              {myReservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="reservation-item-row p-2 border rounded d-flex justify-content-between align-items-center bg-light-subtle hover-shadow"
                  style={{ cursor: "pointer" }}
                  onClick={() => onReservationClick(reservation)}
                >
                  <div className="overflow-hidden me-2">
                    <div className="fw-bold text-dark text-truncate">
                      {reservation.booth_id}
                    </div>
                    <div className="text-muted small">
                      📅 {reservation.date} | ⏰ {reservation.time_slot}
                    </div>
                  </div>
                  <button className="btn btn-outline-danger btn-sm shrink-0">
                    취소
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-3 text-muted bg-light rounded">
              <small>아직 신청한 예약이 없습니다.</small>
            </div>
          )}
        </>
      )}
    </div>
  );
};
