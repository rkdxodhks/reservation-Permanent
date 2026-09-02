// Reading this as: Pusan National University BioMaterial Science (BAF) reservation platform with master admin passcode (202345603) and strict cancellation password validation security.

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

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

function App() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [booths, setBooths] = useState(DEFAULT_BOOTHS);
  const [reservations, setReservations] = useState([]);
  const [slotBlocks, setSlotBlocks] = useState([]);

  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [authNumber, setAuthNumber] = useState("");
  const [selectedLab, setSelectedLab] = useState(DEFAULT_BOOTHS[0].name);
  const [selectedDate, setSelectedDate] = useState(DEFAULT_SETTINGS.event_dates[0]);

  // Cancel Verification State
  const [cancelAuthPassword, setCancelAuthPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [modalContext, setModalContext] = useState(null);
  const [currentReservationCount, setCurrentReservationCount] = useState(0);

  const channelsRef = useRef([]);
  const publicUrl = process.env.PUBLIC_URL || "";

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

  const fetchBooths = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("booths")
        .select("*")
        .order("display_order", { ascending: true });
      if (!error && data && data.length > 0) {
        const uniqueData = data.filter(
          (b, idx, self) => idx === self.findIndex((item) => item.name === b.name)
        );
        setBooths(uniqueData);
        if (!uniqueData.some((b) => b.name === selectedLab)) {
          setSelectedLab(uniqueData[0].name);
        }
      }
    } catch (err) {
      console.warn("Using default booths fallback:", err);
    }
  }, [selectedLab]);

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

  const handleRefreshAll = useCallback(() => {
    fetchSettings();
    fetchBooths();
    fetchReservationsAndBlocks();
  }, [fetchSettings, fetchBooths, fetchReservationsAndBlocks]);

  useEffect(() => {
    handleRefreshAll();

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

  useEffect(() => {
    if (!studentId) {
      setCurrentReservationCount(0);
      return;
    }
    const count = reservations.filter((r) => r.student_id === studentId).length;
    setCurrentReservationCount(count);
  }, [studentId, reservations]);

  // Pre-fill cancellation password input when modal opens
  useEffect(() => {
    if (showReservationModal && modalContext?.type === "cancel") {
      setCancelAuthPassword(authNumber || "");
    }
  }, [showReservationModal, modalContext, authNumber]);

  const timeSlots = generateTimeSlots(
    settings.start_time || "10:00",
    settings.end_time || "16:00",
    settings.slot_interval || 20
  );

  const handleTimeSlotClick = (timeSlot, reservationsForSlot) => {
    if (!studentId || !studentName || !authNumber) {
      toast.info("예약을 진행하려면 학번, 성함, 비밀번호를 먼저 입력해 주세요.");
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

  const handleConfirmReservation = async () => {
    if (!modalContext) return;
    setLoading(true);

    try {
      const userResCount = reservations.filter((r) => r.student_id === studentId).length;
      if (userResCount >= (settings.max_reservations_per_student || 2)) {
        toast.error(`1인당 최대 ${settings.max_reservations_per_student || 2}회까지만 예약 가능합니다.`);
        setLoading(false);
        setShowReservationModal(false);
        return;
      }

      const slotResCount = reservations.filter(
        (r) =>
          r.booth_id === modalContext.lab &&
          r.date === modalContext.date &&
          r.time_slot === modalContext.timeSlot
      ).length;

      const slotCapacityLimit = settings.max_capacity_per_slot || 1;
      if (slotResCount >= slotCapacityLimit) {
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

      toast.success("예약이 완료되었습니다.");
      fetchReservationsAndBlocks();
    } catch (err) {
      console.error("Create reservation error:", err);
      toast.error(`예약 처리 중 오류: ${err.message}`);
    } finally {
      setLoading(false);
      setShowReservationModal(false);
    }
  };

  // SECURITY ENHANCEMENT: Verification of secret password before cancellation
  const handleConfirmCancel = async () => {
    if (!modalContext || !modalContext.reservationId) return;

    const targetRes = reservations.find((r) => r.id === modalContext.reservationId);
    if (targetRes) {
      if (!cancelAuthPassword.trim()) {
        toast.error("취소 비밀번호를 입력해 주세요.");
        return;
      }
      if (cancelAuthPassword.trim() !== targetRes.auth_number.trim()) {
        toast.error("비밀번호가 일치하지 않아 예약을 취소할 수 없습니다.");
        return;
      }
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("reservations")
        .delete()
        .eq("id", modalContext.reservationId);

      if (error) throw error;

      toast.info("예약이 성공적으로 취소되었습니다.");
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
    <div className="app-main-wrapper bg-slate min-vh-100 d-flex flex-column">
      <ToastContainer transition={Slide} position="top-right" autoClose={3000} />

      {/* HEADER BAR */}
      <header className="taste-header sticky-top border-bottom">
        <div className="container-fluid max-w-7xl px-3 py-2.5 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <div className="brand-logo-group d-flex align-items-center gap-2">
              <img
                src={`${publicUrl}/부산대.ico`}
                alt="PNU"
                className="brand-icon-lg"
              />
              <div className="brand-line" />
              <img
                src={`${publicUrl}/baf-logo.png`}
                alt="BAF"
                className="baf-icon-lg"
              />
            </div>

            <div>
              <div className="d-flex align-items-center gap-2">
                <span className="pill-tag font-mono">
                  PNU BioMaterial Science
                </span>
                <h1 className="h6 fw-semibold mb-0 text-slate-900 brand-title">
                  {settings.event_title || "부산대학교 바이오소재과학과 BAF 체험부스 실시간 예약 시스템"}
                </h1>
              </div>
            </div>
          </div>

          <Button
            variant="outline-secondary"
            size="sm"
            className="btn-taste-outline d-flex align-items-center gap-2 rounded-pill px-3"
            onClick={() => setShowAdminModal(true)}
          >
            <SettingsIcon />
            <span className="d-none d-sm-inline font-medium">관리자</span>
          </Button>
        </div>
      </header>

      {/* MAIN CONTENT: 3-COLUMN LAYOUT */}
      <main className="container-fluid max-w-7xl py-4 flex-grow-1">
        <div className="row g-4">
          
          {/* LEFT COLUMN */}
          <div className="col-12 col-lg-3">
            <div className="taste-card p-4 mb-3">
              <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                <h6 className="fw-semibold mb-0 text-slate-900 d-flex align-items-center gap-2">
                  <UserIcon />
                  <span>예약자 정보</span>
                </h6>
                <small className="text-slate-400 fs-7">필수 입력</small>
              </div>

              <Form>
                <Form.Group className="mb-3">
                  <Form.Label className="form-label-taste">학번</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="예: 202345603"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value.trim())}
                    maxLength={15}
                    className="form-control-taste"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="form-label-taste">성함</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="성함 입력"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="form-control-taste"
                  />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label className="form-label-taste">취소용 비밀번호</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="4자리 이상 설정"
                    value={authNumber}
                    onChange={(e) => setAuthNumber(e.target.value)}
                    className="form-control-taste"
                  />
                </Form.Group>
              </Form>
            </div>

            <div className="taste-card p-4 mb-3 d-none d-lg-block">
              <LabsList
                booths={booths}
                selectedLab={selectedLab}
                onLabSelect={(labName) => setSelectedLab(labName)}
              />
            </div>
          </div>

          {/* CENTER MAIN COLUMN */}
          <div className="col-12 col-lg-6">
            <div className="taste-card p-3 mb-3 d-lg-none">
              <LabsList
                booths={booths}
                selectedLab={selectedLab}
                onLabSelect={(labName) => setSelectedLab(labName)}
              />
            </div>

            <div className="taste-card p-3 p-md-4">
              <Timetable
                studentId={studentId}
                selectedLab={selectedLab}
                selectedDate={selectedDate}
                reservations={reservations.filter(
                  (r) => r.booth_id === selectedLab && r.date === selectedDate
                )}
                currentReservationCount={currentReservationCount}
                maxReservationsPerStudent={settings.max_reservations_per_student || 2}
                maxCapacityPerSlot={settings.max_capacity_per_slot || 1}
                timeSlots={timeSlots}
                slotBlocks={slotBlocks}
                onCardClick={handleTimeSlotClick}
                isAdminMode={false}
              />
            </div>
          </div>

          {/* RIGHT COLUMN: Date Selector on top of My Reservations */}
          <div className="col-12 col-lg-3">
            <div className="taste-card p-4 mb-3">
              <h6 className="fw-semibold mb-3 text-slate-900 d-flex align-items-center gap-2">
                <CalendarIcon />
                <span>행사 날짜 선택</span>
              </h6>
              <div className="d-flex flex-column gap-2">
                {settings.event_dates?.map((dateStr) => {
                  const isSelected = selectedDate === dateStr;
                  return (
                    <button
                      key={dateStr}
                      type="button"
                      className={`btn date-pill-btn w-100 py-2.5 ${
                        isSelected ? "active" : ""
                      }`}
                      onClick={() => setSelectedDate(dateStr)}
                    >
                      <span>{dateStr}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <MyReservations
              studentId={studentId}
              reservationsByDate={{ [selectedDate]: reservations }}
              currentReservationCount={currentReservationCount}
              maxReservationsPerStudent={settings.max_reservations_per_student || 2}
              onReservationClick={handleMyReservationClick}
            />
          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="taste-footer border-top py-4 mt-auto">
        <div className="container max-w-7xl text-center">
          <div className="d-flex justify-content-center align-items-center gap-3 mb-2">
            <img
              src={`${publicUrl}/부산대.ico`}
              alt="PNU"
              style={{ width: "24px", height: "24px" }}
            />
            <img
              src={`${publicUrl}/baf-logo.png`}
              alt="BAF"
              style={{ height: "22px" }}
            />
            <span className="fw-medium text-slate-700 text-sm">부산대학교 바이오소재과학과 BAF</span>
          </div>
          <p className="mb-0 text-slate-500 small">
            {settings.event_title || "부산대학교 바이오소재과학과 BAF 체험부스 실시간 예약 시스템"} © 2026 Pusan National University BioMaterial Science. All Rights Reserved.
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
      <Modal show={showInfoModal} onHide={() => setShowInfoModal(false)} centered className="taste-modal">
        <Modal.Header closeButton className="border-bottom-0">
          <Modal.Title className="h6 fw-semibold text-slate-900">입력 안내</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-4">
          <p className="mb-3 text-slate-600">예약을 진행하려면 학번, 성함, 비밀번호를 먼저 입력해 주세요.</p>
          <Button variant="primary" className="btn-taste-primary px-4" onClick={() => setShowInfoModal(false)}>
            정보 입력하기
          </Button>
        </Modal.Body>
      </Modal>

      {/* RESERVATION CONFIRM / CANCEL MODAL WITH PASSWORD VERIFICATION */}
      <Modal
        show={showReservationModal}
        onHide={() => setShowReservationModal(false)}
        centered
        className="taste-modal"
      >
        <Modal.Header closeButton className="border-bottom-0">
          <Modal.Title className="h6 fw-semibold text-slate-900">
            {modalContext?.type === "cancel" ? "예약 취소 확인" : "예약 신청 확인"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-3">
          {modalContext?.type === "confirm" ? (
            <div>
              <h5 className="fw-semibold mb-3 text-slate-900">{modalContext.lab}</h5>
              <div className="bg-slate-50 p-3 rounded-3 mb-3 border text-start">
                <p className="mb-1 text-slate-700"><strong>날짜:</strong> {modalContext.date}</p>
                <p className="mb-1 text-slate-700"><strong>시간:</strong> {modalContext.timeSlot}</p>
                <p className="mb-0 text-slate-700"><strong>신청자:</strong> {studentName} ({studentId})</p>
              </div>
              <p className="small text-slate-500 mb-0">위 정보로 예약을 진행하시겠습니까?</p>
            </div>
          ) : (
            <div>
              <h5 className="fw-semibold mb-3 text-slate-900">예약을 취소하시겠습니까?</h5>
              <div className="bg-slate-50 p-3 rounded-3 mb-3 border text-start">
                <p className="mb-1 text-slate-700"><strong>부스:</strong> {modalContext?.lab}</p>
                <p className="mb-1 text-slate-700"><strong>날짜:</strong> {modalContext?.date}</p>
                <p className="mb-0 text-slate-700"><strong>시간:</strong> {modalContext?.timeSlot}</p>
              </div>
              
              {/* Security password input verification */}
              <Form.Group className="mt-3 text-start">
                <Form.Label className="form-label-taste text-slate-900 fw-semibold">
                  취소 비밀번호 검증
                </Form.Label>
                <Form.Control
                  type="password"
                  placeholder="예약 신청 시 설정한 비밀번호 입력"
                  value={cancelAuthPassword}
                  onChange={(e) => setCancelAuthPassword(e.target.value)}
                  className="form-control-taste"
                />
              </Form.Group>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-top-0">
          <Button variant="light" onClick={() => setShowReservationModal(false)} disabled={loading}>
            닫기
          </Button>
          {modalContext?.type === "confirm" ? (
            <Button variant="primary" className="btn-taste-primary" onClick={handleConfirmReservation} disabled={loading}>
              {loading ? <Spinner animation="border" size="sm" /> : "예약 확정"}
            </Button>
          ) : (
            <Button variant="danger" className="btn-taste-danger" onClick={handleConfirmCancel} disabled={loading}>
              {loading ? <Spinner animation="border" size="sm" /> : "취소 검증 및 실행"}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default App;
