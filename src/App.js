// Reading this as: Pusan National University BioMaterial Science (BAF) reservation platform with Apple Liquid Glass mobile floating bar and responsive 3-column desktop layout.

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

// Liquid Glass Mobile Dock Icons
const TimetableTabIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const ProfileTabIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const TicketTabIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
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

  // Mobile Active Tab State: "timetable" | "info" | "my"
  const [mobileTab, setMobileTab] = useState("timetable");

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

  const selectedBoothObj = booths.find((b) => b.name === selectedLab);

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
      const maxReservationsLimit = Number(settings.max_reservations_per_student) || 2;
      if (userResCount >= maxReservationsLimit) {
        toast.error(`1인당 최대 ${maxReservationsLimit}회까지만 예약 가능합니다.`);
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

      const slotCapacityLimit = Number(settings.max_capacity_per_slot) || 1;
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
      <header className="taste-header sticky-top border-bottom py-3">
        <div className="container-fluid max-w-7xl px-3 px-md-4 d-flex justify-content-between align-items-center">
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
              <h1 className="h6 fw-semibold mb-0 text-slate-900 brand-title d-none d-sm-block">
                {settings.event_title || "부산대학교 바이오소재과학과 BAF 체험부스 실시간 예약 시스템"}
              </h1>
              <p className="mb-0 text-slate-800 small d-sm-none fw-semibold">
                BAF 체험부스 실시간 예약
              </p>
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

      {/* MAIN CONTENT AREA */}
      <main className="container-fluid max-w-7xl py-4 flex-grow-1 app-main-content-mobile">
        
        {/* ========================================================
            DESKTOP VIEW (≥ 992px): Classic 3-Column Grid
           ======================================================== */}
        <div className="d-none d-lg-block">
          <div className="row g-4">
            
            {/* LEFT COLUMN: Student Info & Booth List */}
            <div className="col-lg-3">
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

              <div className="taste-card p-4 mb-3">
                <LabsList
                  booths={booths}
                  selectedLab={selectedLab}
                  onLabSelect={(labName) => setSelectedLab(labName)}
                />
              </div>
            </div>

            {/* CENTER MAIN COLUMN: Timetable */}
            <div className="col-lg-6">
              <div className="taste-card p-4">
                <Timetable
                  studentId={studentId}
                  selectedLab={selectedLab}
                  selectedDate={selectedDate}
                  selectedBoothDesc={selectedBoothObj?.description}
                  reservations={reservations.filter(
                    (r) => r.booth_id === selectedLab && r.date === selectedDate
                  )}
                  currentReservationCount={currentReservationCount}
                  maxReservationsPerStudent={Number(settings.max_reservations_per_student) || 2}
                  maxCapacityPerSlot={Number(settings.max_capacity_per_slot) || 1}
                  timeSlots={timeSlots}
                  slotBlocks={slotBlocks}
                  onCardClick={handleTimeSlotClick}
                  isAdminMode={false}
                />
              </div>
            </div>

            {/* RIGHT COLUMN: Date Selector & My Reservations */}
            <div className="col-lg-3">
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
                maxReservationsPerStudent={Number(settings.max_reservations_per_student) || 2}
                onReservationClick={handleMyReservationClick}
              />
            </div>

          </div>
        </div>

        {/* ========================================================
            MOBILE & TABLET VIEW (< 992px): Apple Liquid Glass Controlled
           ======================================================== */}
        <div className="d-lg-none">
          {/* TAB 1: TIMETABLE VIEW */}
          {mobileTab === "timetable" && (
            <div className="mobile-tab-view animate-fade-in">
              {/* Compact Date Selector */}
              <div className="taste-card p-3 mb-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-xs fw-semibold text-slate-700">행사 날짜 선택</span>
                  {!studentId ? (
                    <span
                      className="text-xs text-blue-600 fw-medium cursor-pointer"
                      onClick={() => setMobileTab("info")}
                      style={{ cursor: "pointer" }}
                    >
                      내 정보 입력하기 →
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500">
                      {studentName} ({studentId})
                    </span>
                  )}
                </div>
                <div className="d-flex gap-2 overflow-x-auto pb-1" style={{ WebkitOverflowScrolling: "touch" }}>
                  {settings.event_dates?.map((dateStr) => (
                    <button
                      key={dateStr}
                      type="button"
                      className={`btn date-pill-btn py-2 px-3 text-sm flex-shrink-0 ${
                        selectedDate === dateStr ? "active" : ""
                      }`}
                      onClick={() => setSelectedDate(dateStr)}
                    >
                      {dateStr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Compact Booth Pills */}
              <div className="taste-card p-3 mb-3">
                <LabsList
                  booths={booths}
                  selectedLab={selectedLab}
                  onLabSelect={(labName) => setSelectedLab(labName)}
                />
              </div>

              {/* Main Timetable Card */}
              <div className="taste-card p-3">
                <Timetable
                  studentId={studentId}
                  selectedLab={selectedLab}
                  selectedDate={selectedDate}
                  selectedBoothDesc={selectedBoothObj?.description}
                  reservations={reservations.filter(
                    (r) => r.booth_id === selectedLab && r.date === selectedDate
                  )}
                  currentReservationCount={currentReservationCount}
                  maxReservationsPerStudent={Number(settings.max_reservations_per_student) || 2}
                  maxCapacityPerSlot={Number(settings.max_capacity_per_slot) || 1}
                  timeSlots={timeSlots}
                  slotBlocks={slotBlocks}
                  onCardClick={handleTimeSlotClick}
                  isAdminMode={false}
                />
              </div>
            </div>
          )}

          {/* TAB 2: PROFILE / STUDENT INFO VIEW */}
          {mobileTab === "info" && (
            <div className="mobile-tab-view animate-fade-in">
              <div className="taste-card p-4">
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

                  <Form.Group className="mb-4">
                    <Form.Label className="form-label-taste">취소용 비밀번호</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="4자리 이상 설정"
                      value={authNumber}
                      onChange={(e) => setAuthNumber(e.target.value)}
                      className="form-control-taste"
                    />
                    <Form.Text className="text-slate-500 text-xs">
                      * 예약 후 본인 확인 및 취소 시 필요한 비밀번호입니다.
                    </Form.Text>
                  </Form.Group>

                  <Button
                    variant="primary"
                    className="btn-taste-primary w-100 py-2.5"
                    onClick={() => {
                      if (studentId && studentName && authNumber) {
                        toast.success("예약자 정보가 설정되었습니다.");
                        setMobileTab("timetable");
                      } else {
                        toast.warn("학번, 성함, 비밀번호를 모두 입력해 주세요.");
                      }
                    }}
                  >
                    확인 및 시간표 보러가기
                  </Button>
                </Form>
              </div>
            </div>
          )}

          {/* TAB 3: MY RESERVATIONS VIEW */}
          {mobileTab === "my" && (
            <div className="mobile-tab-view animate-fade-in">
              <MyReservations
                studentId={studentId}
                reservationsByDate={{ [selectedDate]: reservations }}
                currentReservationCount={currentReservationCount}
                maxReservationsPerStudent={Number(settings.max_reservations_per_student) || 2}
                onReservationClick={handleMyReservationClick}
              />
            </div>
          )}
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

      {/* ========================================================
          APPLE LIQUID GLASS FLOATING DOCK (Mobile Only, d-lg-none)
         ======================================================== */}
      <div className="liquid-glass-container d-lg-none">
        <nav className="liquid-glass-bar">
          <button
            type="button"
            className={`liquid-glass-tab ${mobileTab === "timetable" ? "active" : ""}`}
            onClick={() => setMobileTab("timetable")}
          >
            <TimetableTabIcon />
            <span>시간표</span>
          </button>

          <button
            type="button"
            className={`liquid-glass-tab ${mobileTab === "info" ? "active" : ""}`}
            onClick={() => setMobileTab("info")}
          >
            <ProfileTabIcon />
            <span>내 정보</span>
            {!studentId && <span className="liquid-dot" />}
          </button>

          <button
            type="button"
            className={`liquid-glass-tab ${mobileTab === "my" ? "active" : ""}`}
            onClick={() => setMobileTab("my")}
          >
            <TicketTabIcon />
            <span>내 예약</span>
            {currentReservationCount > 0 && (
              <span className="liquid-badge">{currentReservationCount}</span>
            )}
          </button>
        </nav>
      </div>

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
          <Button
            variant="primary"
            className="btn-taste-primary px-4"
            onClick={() => {
              setShowInfoModal(false);
              setMobileTab("info");
            }}
          >
            정보 입력하기
          </Button>
        </Modal.Body>
      </Modal>

      {/* RESERVATION CONFIRM / CANCEL MODAL */}
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
