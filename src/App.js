import React, { useState, useEffect, useCallback, useRef } from "react";
import { LabsList, MyReservations } from "./StatusPanel";
import Timetable from "./Timetable";
import AdminModal from "./AdminModal";
import {
  DEFAULT_SETTINGS,
  DEFAULT_BOOTHS,
  generateTimeSlots,
} from "./constants";
import { supabase } from "./supabaseClient";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { Modal, Button, Form, Spinner } from "react-bootstrap";
import { ToastContainer, toast, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  // 1. Dynamic Config State
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [booths, setBooths] = useState(DEFAULT_BOOTHS);
  const [reservations, setReservations] = useState([]);
  const [slotBlocks, setSlotBlocks] = useState([]);

  // 2. User & Selection State
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [authNumber, setAuthNumber] = useState("");
  const [selectedLab, setSelectedLab] = useState(DEFAULT_BOOTHS[0].name);
  const [selectedDate, setSelectedDate] = useState(DEFAULT_SETTINGS.event_dates[0]);

  // 3. UI & Admin Modal State
  const [loading, setLoading] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [modalContext, setModalContext] = useState(null);
  const [currentReservationCount, setCurrentReservationCount] = useState(0);

  const channelsRef = useRef([]);

  // Fetch Settings from Supabase
  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("app_settings").select("*").eq("id", 1).single();
      if (!error && data) {
        setSettings(data);
        if (data.event_dates && data.event_dates.length > 0) {
          if (!data.event_dates.includes(selectedDate)) {
            setSelectedDate(data.event_dates[0]);
          }
        }
      }
    } catch (err) {
      console.warn("Using default settings fallback:", err);
    }
  }, [selectedDate]);

  // Fetch Booths from Supabase
  const fetchBooths = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("booths")
        .select("*")
        .order("display_order", { ascending: true });
      if (!error && data && data.length > 0) {
        setBooths(data);
        if (!data.some((b) => b.name === selectedLab)) {
          setSelectedLab(data[0].name);
        }
      }
    } catch (err) {
      console.warn("Using default booths fallback:", err);
    }
  }, [selectedLab]);

  // Fetch Reservations & Blocks from Supabase
  const fetchReservationsAndBlocks = useCallback(async () => {
    try {
      const { data: resData, error: resErr } = await supabase.from("reservations").select("*");
      if (!resErr && resData) {
        setReservations(resData);
      }

      const { data: blockData, error: blockErr } = await supabase.from("slot_blocks").select("*");
      if (!blockErr && blockData) {
        setSlotBlocks(blockData);
      }
    } catch (err) {
      console.warn("Error fetching reservations or blocks:", err);
    }
  }, []);

  // Refresh all
  const handleRefreshAll = useCallback(() => {
    fetchSettings();
    fetchBooths();
    fetchReservationsAndBlocks();
  }, [fetchSettings, fetchBooths, fetchReservationsAndBlocks]);

  // Initial Load & Realtime Subscriptions
  useEffect(() => {
    handleRefreshAll();

    // Supabase Realtime Channels
    const channel1 = supabase
      .channel("realtime-app-settings")
      .on("postgres_changes", { event: "*", schema: "public", table: "app_settings" }, fetchSettings)
      .subscribe();

    const channel2 = supabase
      .channel("realtime-booths")
      .on("postgres_changes", { event: "*", schema: "public", table: "booths" }, fetchBooths)
      .subscribe();

    const channel3 = supabase
      .channel("realtime-reservations")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, fetchReservationsAndBlocks)
      .subscribe();

    const channel4 = supabase
      .channel("realtime-blocks")
      .on("postgres_changes", { event: "*", schema: "public", table: "slot_blocks" }, fetchReservationsAndBlocks)
      .subscribe();

    channelsRef.current = [channel1, channel2, channel3, channel4];

    return () => {
      channelsRef.current.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [handleRefreshAll, fetchSettings, fetchBooths, fetchReservationsAndBlocks]);

  // Keyboard shortcut Ctrl+Shift+A for Admin Modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "A" || e.key === "a")) {
        e.preventDefault();
        setShowAdminModal(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Update current user's reservation count
  useEffect(() => {
    if (!studentId) {
      setCurrentReservationCount(0);
      return;
    }
    const count = reservations.filter((r) => r.student_id === studentId).length;
    setCurrentReservationCount(count);
  }, [studentId, reservations]);

  // Dynamic time slots array generated from settings
  const timeSlots = generateTimeSlots(
    settings.start_time || "10:00",
    settings.end_time || "16:00",
    settings.slot_interval || 20
  );

  // Time slot card click
  const handleTimeSlotClick = (timeSlot, reservationsForSlot) => {
    if (!studentId || !studentName || !authNumber) {
      toast.info("예약을 진행하려면 먼저 성함, 학번, 비밀번호를 입력해주세요.");
      setShowInfoModal(true);
      return;
    }

    const isMyReservation = reservationsForSlot.some(
      (r) => r.student_id === studentId
    );

    setModalContext({
      type: isMyReservation ? "cancel" : "confirm",
      timeSlot,
      lab: selectedLab,
      date: selectedDate,
      reservationsForSlot,
      reservationId: reservationsForSlot.find((r) => r.student_id === studentId)?.id,
    });
    setShowReservationModal(true);
  };

  // My Reservation click cancellation
  const handleMyReservationClick = (reservation) => {
    setModalContext({
      type: "cancel",
      timeSlot: reservation.time_slot,
      lab: reservation.booth_id,
      date: reservation.date,
      reservationId: reservation.id,
    });
    setShowReservationModal(true);
  };

  // Confirm create reservation
  const handleConfirmReservation = async () => {
    if (!modalContext) return;
    setLoading(true);

    try {
      // Check user limit
      const userResCount = reservations.filter((r) => r.student_id === studentId).length;
      if (userResCount >= (settings.max_reservations_per_student || 2)) {
        toast.error(`1인당 최대 ${settings.max_reservations_per_student || 2}회까지만 예약 가능합니다.`);
        setLoading(false);
        setShowReservationModal(false);
        return;
      }

      // Check slot capacity
      const slotResCount = reservations.filter(
        (r) =>
          r.booth_id === modalContext.lab &&
          r.date === modalContext.date &&
          r.time_slot === modalContext.timeSlot
      ).length;

      if (slotResCount >= (settings.max_capacity_per_slot || 2)) {
        toast.error("해당 시간대는 이미 정원이 마감되었습니다.");
        setLoading(false);
        setShowReservationModal(false);
        return;
      }

      const newReservation = {
        student_id: studentId,
        student_name: studentName,
        auth_number: authNumber,
        booth_id: modalContext.lab,
        date: modalContext.date,
        time_slot: modalContext.timeSlot,
      };

      const { error } = await supabase.from("reservations").insert([newReservation]);
      if (error) throw error;

      toast.success("예약이 완료되었습니다!");
      fetchReservationsAndBlocks();
    } catch (err) {
      console.error("Create reservation error:", err);
      toast.error(`예약 처리 중 오류: ${err.message}`);
    } finally {
      setLoading(false);
      setShowReservationModal(false);
    }
  };

  // Confirm cancel reservation
  const handleConfirmCancel = async () => {
    if (!modalContext || !modalContext.reservationId) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from("reservations")
        .delete()
        .eq("id", modalContext.reservationId);

      if (error) throw error;

      toast.info("예약이 취소되었습니다.");
      fetchReservationsAndBlocks();
    } catch (err) {
      console.error("Cancel reservation error:", err);
      toast.error(`취소 실패: ${err.message}`);
    } finally {
      setLoading(false);
      setShowReservationModal(false);
    }
  };

  return (
    <div className="app-main-wrapper bg-light min-vh-100 d-flex flex-column">
      <ToastContainer transition={Slide} position="top-right" autoClose={3000} />

      {/* Top Navbar */}
      <nav className="navbar navbar-expand bg-white border-bottom sticky-top py-2 px-3 shadow-xs">
        <div className="container-fluid max-w-7xl px-0 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <span className="fs-4">🏛️</span>
            <div>
              <h1 className="h6 fw-bold mb-0 text-dark">
                {settings.event_title || "연구실 체험부스 실시간 예약 시스템"}
              </h1>
              <small className="text-muted d-none d-sm-inline">
                실시간 동기화 예약 체계 v2.0
              </small>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            {/* Admin shortcut button */}
            <Button
              variant="outline-dark"
              size="sm"
              className="d-flex align-items-center gap-1 rounded-pill px-3"
              onClick={() => setShowAdminModal(true)}
            >
              <span>⚙️</span>
              <span className="d-none d-sm-inline">관리자</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="container-fluid max-w-7xl py-3 py-md-4 flex-grow-1">
        <div className="row g-3 g-lg-4">
          
          {/* LEFT SIDEBAR / TOP CONTROLS (PC: 4 cols, Mobile/Tablet: full width) */}
          <div className="col-12 col-lg-4 col-xl-3">
            {/* User Info Form Box */}
            <div className="bg-white p-3 rounded shadow-sm border mb-3">
              <h6 className="fw-bold mb-3 text-dark d-flex align-items-center gap-2">
                <span>👤 예약자 정보 입력</span>
              </h6>
              <Form>
                <Form.Group className="mb-2">
                  <Form.Label className="small text-muted mb-1">학번 (예: 202612345)</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="9자리 학번 입력"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value.trim())}
                    maxLength={15}
                  />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label className="small text-muted mb-1">성함</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="이름 입력"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="small text-muted mb-1">취소용 비밀번호 (4자리 이상)</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="비밀번호 설정"
                    value={authNumber}
                    onChange={(e) => setAuthNumber(e.target.value)}
                  />
                </Form.Group>
              </Form>
            </div>

            {/* Date Selector Tabs */}
            <div className="bg-white p-3 rounded shadow-sm border mb-3">
              <h6 className="fw-bold mb-2 text-dark">📅 행사 날짜 선택</h6>
              <div className="d-flex flex-wrap gap-2">
                {settings.event_dates?.map((dateStr) => {
                  const isSelected = selectedDate === dateStr;
                  return (
                    <button
                      key={dateStr}
                      type="button"
                      className={`btn flex-grow-1 text-center py-2 ${
                        isSelected ? "btn-primary fw-bold" : "btn-outline-secondary"
                      }`}
                      onClick={() => setSelectedDate(dateStr)}
                    >
                      {dateStr}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Booth Selector List */}
            <div className="bg-white p-3 rounded shadow-sm border mb-3 d-none d-lg-block">
              <LabsList
                booths={booths}
                selectedLab={selectedLab}
                onLabSelect={(labName) => setSelectedLab(labName)}
              />
            </div>

            {/* My Reservations List Panel */}
            <MyReservations
              studentId={studentId}
              reservationsByDate={{ [selectedDate]: reservations }}
              currentReservationCount={currentReservationCount}
              maxReservationsPerStudent={settings.max_reservations_per_student || 2}
              onReservationClick={handleMyReservationClick}
            />
          </div>

          {/* RIGHT MAIN PANEL (PC: 8-9 cols, Mobile/Tablet: full width) */}
          <div className="col-12 col-lg-8 col-xl-9">
            {/* Booth Selector Pill Tabs for Mobile & Tablet */}
            <div className="bg-white p-3 rounded shadow-sm border mb-3 d-lg-none">
              <LabsList
                booths={booths}
                selectedLab={selectedLab}
                onLabSelect={(labName) => setSelectedLab(labName)}
              />
            </div>

            {/* Timetable View */}
            <div className="bg-white rounded shadow-sm border p-2 p-md-3">
              <Timetable
                studentId={studentId}
                selectedLab={selectedLab}
                selectedDate={selectedDate}
                reservations={reservations.filter(
                  (r) => r.booth_id === selectedLab && r.date === selectedDate
                )}
                currentReservationCount={currentReservationCount}
                maxReservationsPerStudent={settings.max_reservations_per_student || 2}
                maxCapacityPerSlot={settings.max_capacity_per_slot || 2}
                timeSlots={timeSlots}
                slotBlocks={slotBlocks}
                onCardClick={handleTimeSlotClick}
                isAdminMode={false}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-top py-3 text-center text-muted small mt-auto">
        <div className="container max-w-7xl">
          <p className="mb-0">
            {settings.event_title || "연구실 체험부스 실시간 예약 시스템"} © 2026. All Rights Reserved.
          </p>
        </div>
      </footer>

      {/* ADMIN MODAL */}
      <AdminModal
        show={showAdminModal}
        onHide={() => setShowAdminModal(false)}
        settings={settings}
        booths={booths}
        reservations={reservations}
        slotBlocks={slotBlocks}
        onUpdateSettings={(newSet) => setSettings(newSet)}
        onUpdateBooths={(newBooths) => setBooths(newBooths)}
        onRefreshData={handleRefreshAll}
      />

      {/* USER INFO PROMPT MODAL */}
      <Modal show={showInfoModal} onHide={() => setShowInfoModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="h6 fw-bold">안내</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-4">
          <p className="mb-3">예약을 진행하려면 먼저 학번과 성함, 취소용 비밀번호를 입력해야 합니다.</p>
          <Button variant="primary" onClick={() => setShowInfoModal(false)}>
            확인 및 정보 입력하기
          </Button>
        </Modal.Body>
      </Modal>

      {/* RESERVATION CONFIRM / CANCEL MODAL */}
      <Modal
        show={showReservationModal}
        onHide={() => setShowReservationModal(false)}
        centered
        className="reservation-action-modal"
      >
        <Modal.Header closeButton className="border-bottom-0">
          <Modal.Title className="h6 fw-bold">
            {modalContext?.type === "cancel" ? "예약 취소 확인" : "예약 신청 확인"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-3">
          {modalContext?.type === "confirm" ? (
            <div className="text-center">
              <div className="fs-1 mb-2">📌</div>
              <h5 className="fw-bold mb-3">{modalContext.lab}</h5>
              <div className="bg-light p-3 rounded mb-3 text-start">
                <p className="mb-1"><strong>예약 날짜:</strong> {modalContext.date}</p>
                <p className="mb-1"><strong>시간대:</strong> {modalContext.timeSlot}</p>
                <p className="mb-0"><strong>신청자:</strong> {studentName} ({studentId})</p>
              </div>
              <p className="small text-muted">위 정보로 예약을 확정하시겠습니까?</p>
            </div>
          ) : (
            <div className="text-center">
              <div className="fs-1 mb-2">🗑️</div>
              <h5 className="fw-bold mb-3">예약을 취소하시겠습니까?</h5>
              <div className="bg-light p-3 rounded mb-3 text-start">
                <p className="mb-1"><strong>부스:</strong> {modalContext?.lab}</p>
                <p className="mb-1"><strong>날짜:</strong> {modalContext?.date}</p>
                <p className="mb-0"><strong>시간대:</strong> {modalContext?.timeSlot}</p>
              </div>
              <p className="small text-danger">취소 후 다시 해당 슬롯을 예약해야 합니다.</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-top-0">
          <Button variant="secondary" onClick={() => setShowReservationModal(false)} disabled={loading}>
            창 닫기
          </Button>
          {modalContext?.type === "confirm" ? (
            <Button variant="primary" onClick={handleConfirmReservation} disabled={loading}>
              {loading ? <Spinner animation="border" size="sm" /> : "예약 확정"}
            </Button>
          ) : (
            <Button variant="danger" onClick={handleConfirmCancel} disabled={loading}>
              {loading ? <Spinner animation="border" size="sm" /> : "취소 실행"}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default App;
