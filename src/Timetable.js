import React from "react";
import { toast } from "react-toastify";

// Modern Minimalist User Icon Component
const UserBadgeIcon = ({ isMine, isFilled }) => {
  let color = "#e2e8f0"; // slate-200 (empty)
  if (isFilled) {
    color = isMine ? "#10b981" : "#3b82f6"; // green for mine, blue for others
  }

  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "inline-block", transition: "transform 0.15s ease" }}
    >
      <path
        d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12ZM12 14C8.68629 14 6 16.6863 6 20H18C18 16.6863 15.3137 14 12 14Z"
        fill={color}
      />
    </svg>
  );
};

const Timetable = ({
  studentId,
  selectedLab,
  selectedDate,
  reservations = [],
  currentReservationCount = 0,
  maxReservationsPerStudent = 2,
  maxCapacityPerSlot = 2,
  timeSlots = [],
  slotBlocks = [],
  onCardClick,
  isAdminMode = false,
}) => {

  const handleCardClick = (timeSlot, isBlocked, reservationsForSlot) => {
    if (isBlocked && !isAdminMode) {
      toast.warning("해당 시간대는 현재 예약이 제한되어 있습니다.");
      return;
    }

    const isMyReservation = reservationsForSlot.some(
      (r) => r.student_id === studentId
    );

    // Limit check
    if (
      currentReservationCount >= maxReservationsPerStudent &&
      !isMyReservation &&
      !isAdminMode
    ) {
      toast.warning(`최대 예약 가능 횟수(${maxReservationsPerStudent}회)에 도달하였습니다.`);
      return;
    }

    onCardClick(timeSlot, reservationsForSlot);
  };

  const getCardStatus = (reservationsForSlot, isBlocked) => {
    if (isBlocked) return "blocked";
    const isMyReservation = reservationsForSlot.some(
      (r) => r.student_id === studentId
    );
    if (isMyReservation) return "mine";
    if (
      currentReservationCount >= maxReservationsPerStudent &&
      !isMyReservation
    )
      return "disabled";
    if (reservationsForSlot.length >= maxCapacityPerSlot) return "full";
    if (reservationsForSlot.length > 0) return "partially";
    return "available";
  };

  const getStatusLabel = (status, currentCount, maxCount) => {
    switch (status) {
      case "blocked":
        return <span className="badge bg-secondary-subtle text-secondary border">예약 불가</span>;
      case "mine":
        return <span className="badge bg-success-subtle text-success border border-success">내 예약</span>;
      case "full":
        return <span className="badge bg-danger-subtle text-danger border border-danger">마감 ({currentCount}/{maxCount})</span>;
      case "partially":
        return <span className="badge bg-primary-subtle text-primary border border-primary">예약 중 ({currentCount}/{maxCount})</span>;
      case "disabled":
        return <span className="badge bg-light text-muted border">한도 도달</span>;
      default:
        return <span className="badge bg-emerald-light text-emerald fw-semibold">신청 가능</span>;
    }
  };

  return (
    <div className="timetable-container p-2 p-md-3">
      {/* Header section */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-3 pb-2 border-bottom">
        <div>
          <h4 className="fw-bold mb-1 text-dark">
            {selectedLab} <span className="text-primary fs-6 fw-normal">예약 시간표</span>
          </h4>
          <p className="text-muted small mb-0">
            원하시는 시간대의 카드를 선택하여 예약을 신청할 수 있습니다.
          </p>
        </div>
        <div className="mt-2 mt-sm-0">
          <span className="badge bg-light text-dark border p-2 fs-6">
            📅 {selectedDate || "날짜 선택됨"}
          </span>
        </div>
      </div>

      {/* Grid container */}
      <div className="row row-cols-2 row-cols-sm-3 row-cols-lg-4 g-2 g-md-3">
        {timeSlots.map((timeSlot) => {
          const reservationsForSlot = reservations.filter(
            (r) => r.time_slot === timeSlot
          );

          const isBlocked = slotBlocks.some(
            (b) =>
              b.booth_id === selectedLab &&
              b.date === selectedDate &&
              b.time_slot === timeSlot
          );

          const status = getCardStatus(reservationsForSlot, isBlocked);
          const isMine = status === "mine";

          return (
            <div key={timeSlot} className="col">
              <div
                className={`card slot-card text-center h-100 position-relative slot-card-${status} ${
                  isMine ? "shadow-sm border-emerald" : ""
                }`}
                onClick={() => handleCardClick(timeSlot, isBlocked, reservationsForSlot)}
              >
                <div className="card-body p-2 p-md-3 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="slot-time fw-bold text-dark fs-5">
                      {timeSlot}
                    </span>
                    {/* User Slot Icons */}
                    <div className="d-flex gap-1">
                      {Array.from({ length: maxCapacityPerSlot }).map((_, i) => {
                        const reservation = reservationsForSlot[i];
                        const isUserMine =
                          reservation && reservation.student_id === studentId;
                        return (
                          <UserBadgeIcon
                            key={i}
                            isFilled={!!reservation}
                            isMine={isUserMine}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mt-2">
                    {getStatusLabel(status, reservationsForSlot.length, maxCapacityPerSlot)}
                    {isAdminMode && (
                      <span className="text-muted small" title="슬롯 관리">
                        ⚙️
                      </span>
                    )}
                  </div>

                  {/* Admin details hover */}
                  {isAdminMode && reservationsForSlot.length > 0 && (
                    <div className="admin-slot-preview mt-2 pt-2 border-top text-start">
                      {reservationsForSlot.map((res, idx) => (
                        <div key={idx} className="small text-truncate text-secondary">
                          • {res.student_name} ({res.student_id})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Timetable;
