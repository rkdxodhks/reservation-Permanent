import React from "react";
import { toast } from "react-toastify";

const SlotUserDot = ({ isMine, isFilled }) => {
  let bgClass = "bg-slate-200";
  if (isFilled) {
    bgClass = isMine ? "bg-emerald-500" : "bg-blue-600";
  }

  return (
    <span
      className={`d-inline-block rounded-circle ${bgClass}`}
      style={{ width: "10px", height: "10px", transition: "all 0.15s ease" }}
    />
  );
};

const Timetable = ({
  studentId,
  selectedLab,
  selectedDate,
  reservations = [],
  currentReservationCount = 0,
  maxReservationsPerStudent = 2,
  maxCapacityPerSlot = 1,
  timeSlots = [],
  slotBlocks = [],
  onCardClick,
  isAdminMode = false,
}) => {
  const handleCardClick = (timeSlot, isBlocked, reservationsForSlot) => {
    if (isBlocked && !isAdminMode) {
      toast.warning("해당 시간대는 현재 예약이 차단되어 있습니다.");
      return;
    }

    const isMyReservation = reservationsForSlot.some(
      (r) => r.student_id === studentId
    );

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

  const getStatusBadge = (status, currentCount, maxCount) => {
    switch (status) {
      case "blocked":
        return <span className="taste-badge taste-badge-neutral">예약 차단</span>;
      case "mine":
        return <span className="taste-badge taste-badge-success">내 예약</span>;
      case "full":
        return <span className="taste-badge taste-badge-danger">마감 ({currentCount}/{maxCount})</span>;
      case "partially":
        return <span className="taste-badge taste-badge-primary">예약 중 ({currentCount}/{maxCount})</span>;
      case "disabled":
        return <span className="taste-badge taste-badge-neutral">한도 도달</span>;
      default:
        return <span className="taste-badge taste-badge-emerald">신청 가능</span>;
    }
  };

  return (
    <div className="timetable-wrapper">
      {/* Clean Main Header (Subtitle and Date badge removed per request) */}
      <div className="mb-3 pb-3 border-bottom">
        <h4 className="fw-semibold mb-0 text-slate-900">
          {selectedLab} <span className="text-slate-500 fs-6 fw-normal">예약 시간표</span>
        </h4>
      </div>

      {/* Timetable Slot Grid */}
      <div className="row row-cols-2 row-cols-sm-3 row-cols-lg-3 g-3">
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

          return (
            <div key={timeSlot} className="col">
              <div
                className={`card slot-card-taste h-100 slot-status-${status}`}
                onClick={() => handleCardClick(timeSlot, isBlocked, reservationsForSlot)}
              >
                <div className="card-body p-3 d-flex flex-column justify-content-between">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="slot-time-text">
                      {timeSlot}
                    </span>
                    <div className="d-flex gap-1 align-items-center">
                      {Array.from({ length: maxCapacityPerSlot }).map((_, i) => {
                        const reservation = reservationsForSlot[i];
                        const isUserMine =
                          reservation && reservation.student_id === studentId;
                        return (
                          <SlotUserDot
                            key={i}
                            isFilled={!!reservation}
                            isMine={isUserMine}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mt-2">
                    {getStatusBadge(status, reservationsForSlot.length, maxCapacityPerSlot)}
                  </div>

                  {isAdminMode && reservationsForSlot.length > 0 && (
                    <div className="mt-2 pt-2 border-top text-start fs-7 text-slate-500">
                      {reservationsForSlot.map((res, idx) => (
                        <div key={idx} className="text-truncate">
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
