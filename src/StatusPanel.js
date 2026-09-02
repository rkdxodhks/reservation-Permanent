import React from "react";

export const LabsList = ({ booths = [], selectedLab, onLabSelect }) => (
  <div className="booth-selection-panel">
    <h6 className="fw-semibold mb-3 text-slate-900">
      체험 부스 선택
    </h6>
    <div className="booth-pill-container d-flex flex-wrap gap-2">
      {booths.map((booth) => {
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

export const MyReservations = ({
  studentId,
  reservationsByDate = {},
  currentReservationCount = 0,
  maxReservationsPerStudent = 2,
  onReservationClick,
}) => {
  const allReservations = Object.values(reservationsByDate).flat();
  const myReservations = studentId
    ? allReservations.filter((r) => r.student_id === studentId)
    : [];

  return (
    <div className="taste-card p-4 mt-3">
      <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
        <h6 className="fw-semibold mb-0 text-slate-900">
          나의 예약 현황
        </h6>
        {studentId && (
          <span
            className={`badge rounded-pill ${
              currentReservationCount >= maxReservationsPerStudent
                ? "bg-rose-100 text-rose-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {currentReservationCount} / {maxReservationsPerStudent} 회
          </span>
        )}
      </div>

      {!studentId ? (
        <div className="text-center py-3 text-slate-400 bg-slate-50 rounded border border-dashed">
          <small>학번을 입력하면 내 예약 내역이 표시됩니다.</small>
        </div>
      ) : (
        <>
          {myReservations.length > 0 ? (
            <div className="d-flex flex-column gap-2">
              {myReservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="my-res-row p-2 border rounded-3 d-flex justify-content-between align-items-center bg-slate-50"
                  onClick={() => onReservationClick(reservation)}
                >
                  <div className="overflow-hidden me-2">
                    <div className="fw-medium text-slate-900 text-truncate text-sm">
                      {reservation.booth_id}
                    </div>
                    <div className="text-slate-500 text-xs">
                      {reservation.date} · {reservation.time_slot}
                    </div>
                  </div>
                  <button className="btn btn-outline-danger btn-sm shrink-0 rounded-2 text-xs px-2 py-1">
                    취소
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-3 text-slate-400 bg-slate-50 rounded text-sm">
              신청한 예약이 없습니다.
            </div>
          )}
        </>
      )}
    </div>
  );
};
