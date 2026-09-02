import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Tab, Nav, Table, Alert } from "react-bootstrap";
import { toast } from "react-toastify";
import { supabase } from "./supabaseClient";

// Modern SVG Icons for Admin Console
const AdminGearIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const AdminBoothIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/>
    <path d="M8.5 2h7"/>
    <path d="M7 16h10"/>
  </svg>
);

const AdminBlockIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
  </svg>
);

const AdminUsersIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

// Mobile & Desktop Friendly Stepper Component for integer settings
const StepperControl = ({ label, value, min = 1, max = 20, unit = "", onChange, description }) => {
  const numValue = Number(value) || min;

  const handleDecrement = () => {
    if (numValue > min) onChange(numValue - 1);
  };
  const handleIncrement = () => {
    if (numValue < max) onChange(numValue + 1);
  };

  return (
    <div className="p-3 border rounded-3 bg-slate-50">
      <div className="d-flex justify-content-between align-items-center mb-1">
        <span className="form-label-taste mb-0">{label}</span>
        <span className="badge bg-slate-200 text-slate-900 font-mono">
          {numValue}{unit}
        </span>
      </div>
      {description && <p className="text-slate-500 text-xs mb-2">{description}</p>}
      <div className="d-flex align-items-center gap-2">
        <Button
          variant="outline-secondary"
          size="sm"
          className="btn-taste-outline px-3 fw-bold"
          onClick={handleDecrement}
          disabled={numValue <= min}
          style={{ width: "38px", height: "38px" }}
        >
          −
        </Button>
        <Form.Select
          value={numValue}
          onChange={(e) => onChange(Number(e.target.value))}
          className="form-control-taste text-center fw-semibold text-slate-900"
          style={{ height: "38px" }}
        >
          {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((n) => (
            <option key={n} value={n}>
              {n} {unit}
            </option>
          ))}
        </Form.Select>
        <Button
          variant="outline-secondary"
          size="sm"
          className="btn-taste-outline px-3 fw-bold"
          onClick={handleIncrement}
          disabled={numValue >= max}
          style={{ width: "38px", height: "38px" }}
        >
          +
        </Button>
      </div>
    </div>
  );
};

export const AdminModal = ({
  show,
  onHide,
  settings,
  booths,
  reservations,
  slotBlocks = [],
  onUpdateSettings,
  onUpdateBooths,
  onRefreshData,
}) => {
  const [passcode, setPasscode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("settings");

  const [formSettings, setFormSettings] = useState({
    ...settings,
    max_reservations_per_student: Number(settings?.max_reservations_per_student) || 2,
    max_capacity_per_slot: Number(settings?.max_capacity_per_slot) || 1,
  });

  const [newDateInput, setNewDateInput] = useState("");

  const [boothList, setBoothList] = useState(booths);
  const [newBoothName, setNewBoothName] = useState("");
  const [newBoothDesc, setNewBoothDesc] = useState("");
  const [newBoothColor, setNewBoothColor] = useState("#2563eb");

  const [searchTerm, setSearchTerm] = useState("");

  const [selectedBlockBooth, setSelectedBlockBooth] = useState(booths[0]?.name || "");
  const [selectedBlockDate, setSelectedBlockDate] = useState(settings?.event_dates?.[0] || "");

  // Permanent Master Admin Passcode
  const MASTER_ADMIN_PASSCODE = "202345603";

  useEffect(() => {
    if (settings) {
      setFormSettings({
        ...settings,
        max_reservations_per_student: Number(settings.max_reservations_per_student) || 2,
        max_capacity_per_slot: Number(settings.max_capacity_per_slot) || 1,
      });
    }
  }, [settings]);

  useEffect(() => {
    setBoothList(booths);
    if (booths.length > 0 && !selectedBlockBooth) {
      setSelectedBlockBooth(booths[0].name);
    }
  }, [booths, selectedBlockBooth]);

  useEffect(() => {
    if (settings?.event_dates?.length > 0 && !selectedBlockDate) {
      setSelectedBlockDate(settings.event_dates[0]);
    }
  }, [settings, selectedBlockDate]);

  const handleLogin = (e) => {
    e.preventDefault();
    const configurableCode = settings?.admin_passcode || "admin1234";
    if (passcode.trim() === MASTER_ADMIN_PASSCODE || passcode.trim() === configurableCode) {
      setIsAuthenticated(true);
      toast.success("관리자 콘솔에 접속되었습니다.");
    } else {
      toast.error("관리자 암호가 일치하지 않습니다.");
    }
  };

  const handleSaveSettings = async () => {
    const payload = {
      id: 1,
      ...formSettings,
      max_reservations_per_student: Number(formSettings.max_reservations_per_student) || 2,
      max_capacity_per_slot: Number(formSettings.max_capacity_per_slot) || 1,
      updated_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase
        .from("app_settings")
        .upsert(payload);

      if (error) throw error;
      toast.success("행사 정책 및 설정이 저장되었습니다.");
      onUpdateSettings(payload);
      onRefreshData();
    } catch (err) {
      console.error("Save settings error:", err);
      onUpdateSettings(payload);
      toast.info("로컬 설정이 저장되었습니다.");
    }
  };

  const handleAddDate = () => {
    if (!newDateInput) return;
    if (formSettings.event_dates.includes(newDateInput)) {
      toast.warning("이미 존재하는 날짜입니다.");
      return;
    }
    const updatedDates = [...formSettings.event_dates, newDateInput].sort();
    setFormSettings({ ...formSettings, event_dates: updatedDates });
    setNewDateInput("");
  };

  const handleRemoveDate = (dateToRemove) => {
    if (formSettings.event_dates.length <= 1) {
      toast.warning("최소 1개의 행사 날짜가 필요합니다.");
      return;
    }
    const updatedDates = formSettings.event_dates.filter((d) => d !== dateToRemove);
    setFormSettings({ ...formSettings, event_dates: updatedDates });
  };

  const handleAddBooth = async () => {
    if (!newBoothName.trim()) {
      toast.warning("부스 이름을 입력해 주세요.");
      return;
    }
    const newBoothItem = {
      name: newBoothName.trim(),
      description: newBoothDesc.trim(),
      color_tag: newBoothColor,
      display_order: boothList.length + 1,
    };

    try {
      const { error } = await supabase.from("booths").insert([newBoothItem]);
      if (error) throw error;
      toast.success("새 부스가 추가되었습니다.");
      onRefreshData();
    } catch (err) {
      console.error("Add booth error:", err);
      const fallbackList = [...boothList, { ...newBoothItem, id: Date.now() }];
      setBoothList(fallbackList);
      onUpdateBooths(fallbackList);
    }

    setNewBoothName("");
    setNewBoothDesc("");
  };

  const handleDeleteBooth = async (boothId) => {
    if (!window.confirm("이 부스를 삭제하시겠습니까?")) return;
    try {
      const { error } = await supabase.from("booths").delete().eq("id", boothId);
      if (error) throw error;
      toast.success("부스가 삭제되었습니다.");
      onRefreshData();
    } catch (err) {
      console.error("Delete booth error:", err);
      const fallbackList = boothList.filter((b) => b.id !== boothId);
      setBoothList(fallbackList);
      onUpdateBooths(fallbackList);
    }
  };

  const handleDeleteReservation = async (resId) => {
    if (!window.confirm("선택한 예약을 강제 취소하시겠습니까?")) return;

    try {
      const { error } = await supabase.from("reservations").delete().eq("id", resId);
      if (error) throw error;
      toast.success("예약이 취소되었습니다.");
      onRefreshData();
    } catch (err) {
      console.error("Delete reservation error:", err);
      toast.error(`삭제 실패: ${err.message}`);
    }
  };

  const handleToggleSlotBlock = async (timeSlot) => {
    const isBlocked = slotBlocks.some(
      (b) => b.booth_id === selectedBlockBooth && b.date === selectedBlockDate && b.time_slot === timeSlot
    );

    try {
      if (isBlocked) {
        const { error } = await supabase
          .from("slot_blocks")
          .delete()
          .match({ booth_id: selectedBlockBooth, date: selectedBlockDate, time_slot: timeSlot });
        if (error) throw error;
        toast.info(`${timeSlot} 슬롯 예약 가능 상태로 변경`);
      } else {
        const { error } = await supabase.from("slot_blocks").insert([
          {
            booth_id: selectedBlockBooth,
            date: selectedBlockDate,
            time_slot: timeSlot,
            reason: "관리자 차단",
          },
        ]);
        if (error) throw error;
        toast.warn(`${timeSlot} 슬롯 예약 차단 완료`);
      }
      onRefreshData();
    } catch (err) {
      console.error("Toggle block error:", err);
      toast.error(`변경 실패: ${err.message}`);
    }
  };

  const handleExportCSV = () => {
    if (!reservations || reservations.length === 0) {
      toast.info("내보낼 예약 데이터가 없습니다.");
      return;
    }

    const headers = ["ID", "학번", "이름", "인증번호", "부스명", "날짜", "시간대", "생성시각"];
    const rows = reservations.map((r) => [
      r.id,
      `"${r.student_id}"`,
      `"${r.student_name}"`,
      `"${r.auth_number}"`,
      `"${r.booth_id}"`,
      `"${r.date}"`,
      `"${r.time_slot}"`,
      `"${r.created_at || ""}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `BAF_reservation_list_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("CSV 엑셀 다운로드가 완료되었습니다.");
  };

  const filteredReservations = (reservations || []).filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.student_id?.toLowerCase().includes(term) ||
      r.student_name?.toLowerCase().includes(term) ||
      r.booth_id?.toLowerCase().includes(term) ||
      r.date?.includes(term)
    );
  });

  return (
    <Modal show={show} onHide={onHide} size="xl" centered backdrop="static" className="taste-modal">
      {/* Sleek Admin Header */}
      <Modal.Header closeButton className="bg-slate-900 text-white border-slate-800 py-3 px-4">
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-emerald-500 text-white font-mono text-xs px-2 py-1">CONSOLE v2.0</span>
          <Modal.Title className="h6 fw-semibold mb-0">
            시스템 관리자 콘솔
          </Modal.Title>
        </div>
      </Modal.Header>

      <Modal.Body className="p-3 p-md-4 bg-slate-50">
        {!isAuthenticated ? (
          /* Login View */
          <div className="taste-card max-w-md mx-auto p-4 p-md-5 text-center my-4">
            <div className="mb-3 d-inline-flex align-items-center justify-content-center bg-blue-50 text-blue-600 rounded-circle" style={{ width: "48px", height: "48px" }}>
              <AdminGearIcon />
            </div>
            <h5 className="fw-semibold text-slate-900 mb-1">관리자 인증</h5>
            <p className="text-slate-500 text-sm mb-4">관리자 권한 암호를 입력해 주세요.</p>
            
            <Form onSubmit={handleLogin}>
              <Form.Group className="mb-3">
                <Form.Control
                  type="password"
                  placeholder="관리자 암호 입력"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  autoFocus
                  className="form-control-taste text-center form-control-lg"
                />
              </Form.Group>
              <Button type="submit" variant="primary" className="btn-taste-primary w-100 py-2.5 fw-semibold">
                접속하기
              </Button>
            </Form>
          </div>
        ) : (
          /* Authenticated Dashboard Tabs */
          <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
            {/* Segmented Tab Navigation */}
            <div className="bg-white p-1.5 rounded-3 border mb-3 overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
              <Nav variant="pills" className="d-flex flex-nowrap gap-1">
                <Nav.Item>
                  <Nav.Link eventKey="settings" className="taste-tab-link d-flex align-items-center gap-2 text-nowrap py-2 px-3">
                    <AdminGearIcon />
                    <span>행사 정책</span>
                  </Nav.Link>
                </Nav.Item>

                <Nav.Item>
                  <Nav.Link eventKey="booths" className="taste-tab-link d-flex align-items-center gap-2 text-nowrap py-2 px-3">
                    <AdminBoothIcon />
                    <span>부스 관리</span>
                  </Nav.Link>
                </Nav.Item>

                <Nav.Item>
                  <Nav.Link eventKey="blocking" className="taste-tab-link d-flex align-items-center gap-2 text-nowrap py-2 px-3">
                    <AdminBlockIcon />
                    <span>슬롯 차단</span>
                  </Nav.Link>
                </Nav.Item>

                <Nav.Item>
                  <Nav.Link eventKey="reservations" className="taste-tab-link d-flex align-items-center gap-2 text-nowrap py-2 px-3">
                    <AdminUsersIcon />
                    <span>예약자 명단</span>
                    <span className="badge bg-slate-200 text-slate-800 font-mono ms-1">{reservations.length}</span>
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </div>

            <Tab.Content className="bg-white p-3 p-md-4 rounded-3 border">
              
              {/* TAB 1: EVENT SETTINGS & CAPACITY POLICIES */}
              <Tab.Pane eventKey="settings">
                <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
                  <h6 className="fw-semibold mb-0 text-slate-900">행사 기본 정보 및 정원 정책</h6>
                  <Button variant="primary" size="sm" className="btn-taste-primary px-3" onClick={handleSaveSettings}>
                    설정 저장
                  </Button>
                </div>

                <Form>
                  <Form.Group className="mb-4">
                    <Form.Label className="form-label-taste">행사 공식 명칭</Form.Label>
                    <Form.Control
                      type="text"
                      value={formSettings.event_title || ""}
                      onChange={(e) => setFormSettings({ ...formSettings, event_title: e.target.value })}
                      className="form-control-taste"
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="form-label-taste">행사 운영 일자</Form.Label>
                    <div className="d-flex flex-wrap gap-2 mb-2">
                      {formSettings.event_dates?.map((d) => (
                        <span
                          key={d}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            background: "#f1f5f9",
                            color: "#1e293b",
                            border: "1px solid #e2e8f0",
                            borderRadius: "6px",
                            padding: "0.35rem 0.65rem",
                            fontSize: "0.875rem",
                            fontWeight: 500,
                          }}
                        >
                          {d}
                          <span
                            style={{ cursor: "pointer", color: "#ef4444", fontWeight: 700 }}
                            onClick={() => handleRemoveDate(d)}
                            title="삭제"
                          >
                            ×
                          </span>
                        </span>
                      ))}
                    </div>
                    <div className="d-flex gap-2 max-w-sm">
                      <Form.Control
                        type="date"
                        value={newDateInput}
                        onChange={(e) => setNewDateInput(e.target.value)}
                        className="form-control-taste"
                      />
                      <Button variant="outline-secondary" size="sm" className="btn-taste-outline text-nowrap" onClick={handleAddDate}>
                        날짜 추가
                      </Button>
                    </div>
                  </Form.Group>

                  {/* Solved: Stepper controls for mobile and desktop */}
                  <div className="row g-3 mb-4">
                    <div className="col-12 col-md-6">
                      <StepperControl
                        label="1인당 최대 예약 가능 횟수"
                        value={formSettings.max_reservations_per_student}
                        min={1}
                        max={10}
                        unit="회"
                        description="한 학생이 행사 기간 동안 예약할 수 있는 최대 횟수입니다."
                        onChange={(newVal) =>
                          setFormSettings({
                            ...formSettings,
                            max_reservations_per_student: newVal,
                          })
                        }
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <StepperControl
                        label="슬롯당 최대 정원"
                        value={formSettings.max_capacity_per_slot}
                        min={1}
                        max={20}
                        unit="명"
                        description="동일한 시간대 슬롯 1개에 입장 가능한 최대 정원입니다."
                        onChange={(newVal) =>
                          setFormSettings({
                            ...formSettings,
                            max_capacity_per_slot: newVal,
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Operation Hours */}
                  <div className="row g-3 mb-4">
                    <div className="col-md-4">
                      <Form.Group>
                        <Form.Label className="form-label-taste">시작 시간</Form.Label>
                        <Form.Control
                          type="text"
                          value={formSettings.start_time || "10:00"}
                          onChange={(e) => setFormSettings({ ...formSettings, start_time: e.target.value })}
                          className="form-control-taste"
                        />
                      </Form.Group>
                    </div>
                    <div className="col-md-4">
                      <Form.Group>
                        <Form.Label className="form-label-taste">종료 시간</Form.Label>
                        <Form.Control
                          type="text"
                          value={formSettings.end_time || "16:00"}
                          onChange={(e) => setFormSettings({ ...formSettings, end_time: e.target.value })}
                          className="form-control-taste"
                        />
                      </Form.Group>
                    </div>
                    <div className="col-md-4">
                      <Form.Group>
                        <Form.Label className="form-label-taste">슬롯 간격</Form.Label>
                        <Form.Select
                          value={formSettings.slot_interval || 20}
                          onChange={(e) =>
                            setFormSettings({
                              ...formSettings,
                              slot_interval: Number(e.target.value),
                            })
                          }
                          className="form-control-taste"
                        >
                          <option value={10}>10분 간격</option>
                          <option value={15}>15분 간격</option>
                          <option value={20}>20분 간격</option>
                          <option value={30}>30분 간격</option>
                          <option value={60}>60분 간격</option>
                        </Form.Select>
                      </Form.Group>
                    </div>
                  </div>

                  {/* Admin Passcode */}
                  <Form.Group className="mb-4">
                    <Form.Label className="form-label-taste">일반 관리자 암호 변경</Form.Label>
                    <Form.Control
                      type="text"
                      value={formSettings.admin_passcode || "admin1234"}
                      onChange={(e) => setFormSettings({ ...formSettings, admin_passcode: e.target.value })}
                      className="form-control-taste max-w-sm"
                    />
                    <Form.Text className="text-slate-500 text-xs">
                      * 고정 마스터 관리자 번호 <code>202345603</code>은 언제나 상시 접속 가능합니다.
                    </Form.Text>
                  </Form.Group>

                  <div className="pt-2">
                    <Button variant="primary" className="btn-taste-primary px-4 py-2" onClick={handleSaveSettings}>
                      설정 저장하기
                    </Button>
                  </div>
                </Form>
              </Tab.Pane>

              {/* TAB 2: BOOTHS MANAGEMENT */}
              <Tab.Pane eventKey="booths">
                <h6 className="fw-semibold mb-3 border-bottom pb-2 text-slate-900">부스 목록 관리</h6>

                {/* Add Booth Card */}
                <div className="bg-slate-50 p-3 rounded-3 border mb-4">
                  <h6 className="fw-semibold mb-3 text-xs text-slate-700">새 부스 추가</h6>
                  <div className="row g-2">
                    <div className="col-12 col-md-4">
                      <Form.Control
                        type="text"
                        placeholder="부스 이름 (예: 나노인공세포실험실)"
                        value={newBoothName}
                        onChange={(e) => setNewBoothName(e.target.value)}
                        className="form-control-taste"
                      />
                    </div>
                    <div className="col-12 col-md-5">
                      <Form.Control
                        type="text"
                        placeholder="부스 설명 텍스트 (예: 인공세포 및 나노기술 응용 실험)"
                        value={newBoothDesc}
                        onChange={(e) => setNewBoothDesc(e.target.value)}
                        className="form-control-taste"
                      />
                    </div>
                    <div className="col-12 col-md-3 d-flex gap-2">
                      <Form.Control
                        type="color"
                        value={newBoothColor}
                        onChange={(e) => setNewBoothColor(e.target.value)}
                        className="form-control-taste p-1"
                        style={{ width: "48px" }}
                        title="태그 색상"
                      />
                      <Button variant="primary" className="btn-taste-primary flex-grow-1" onClick={handleAddBooth}>
                        추가
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Booths Table */}
                <div className="table-responsive">
                  <Table hover className="align-middle text-sm mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: "40px" }}>#</th>
                        <th>부스 명칭</th>
                        <th>상세 설명</th>
                        <th style={{ width: "90px" }}>태그</th>
                        <th style={{ width: "70px" }}>관리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {boothList.map((b, idx) => (
                        <tr key={b.id || idx}>
                          <td className="text-slate-400">{idx + 1}</td>
                          <td className="fw-semibold text-slate-900">{b.name}</td>
                          <td className="text-slate-600">{b.description || "-"}</td>
                          <td>
                            <span
                              className="d-inline-flex align-items-center gap-1.5 px-2 py-1 rounded-pill text-xs fw-medium"
                              style={{ backgroundColor: `${b.color_tag}15`, color: b.color_tag }}
                            >
                              <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: b.color_tag }} />
                              {b.color_tag}
                            </span>
                          </td>
                          <td>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              className="py-1 px-2 text-xs"
                              onClick={() => handleDeleteBooth(b.id)}
                            >
                              삭제
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Tab.Pane>

              {/* TAB 3: SLOT BLOCKING */}
              <Tab.Pane eventKey="blocking">
                <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                  <h6 className="fw-semibold mb-0 text-slate-900">슬롯 예약 차단 설정</h6>
                </div>
                <Alert variant="secondary" className="py-2 text-sm bg-slate-100 border text-slate-700 mb-3">
                  아래 시간대 버튼을 누르면 해당 슬롯의 예약을 <strong>즉시 차단</strong>하거나 <strong>차단 해제</strong>할 수 있습니다.
                </Alert>

                <div className="row g-3 mb-4">
                  <div className="col-12 col-md-6">
                    <Form.Label className="form-label-taste">부스 선택</Form.Label>
                    <Form.Select
                      value={selectedBlockBooth}
                      onChange={(e) => setSelectedBlockBooth(e.target.value)}
                      className="form-control-taste"
                    >
                      {booths.map((b) => (
                        <option key={b.name} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                  <div className="col-12 col-md-6">
                    <Form.Label className="form-label-taste">행사 날짜</Form.Label>
                    <Form.Select
                      value={selectedBlockDate}
                      onChange={(e) => setSelectedBlockDate(e.target.value)}
                      className="form-control-taste"
                    >
                      {settings?.event_dates?.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                </div>

                <div className="d-flex flex-wrap gap-2">
                  {["10:00", "10:20", "10:40", "11:00", "11:20", "11:40", "14:00", "14:20", "14:40", "15:00", "15:20", "15:40"].map((slot) => {
                    const isBlocked = slotBlocks.some(
                      (b) =>
                        b.booth_id === selectedBlockBooth &&
                        b.date === selectedBlockDate &&
                        b.time_slot === slot
                    );

                    return (
                      <Button
                        key={slot}
                        variant={isBlocked ? "danger" : "outline-secondary"}
                        className={`px-3 py-2 text-sm fw-medium ${
                          isBlocked ? "" : "btn-taste-outline"
                        }`}
                        onClick={() => handleToggleSlotBlock(slot)}
                      >
                        {slot} {isBlocked ? "(차단됨)" : "(가능)"}
                      </Button>
                    );
                  })}
                </div>
              </Tab.Pane>

              {/* TAB 4: RESERVATIONS ROSTER */}
              <Tab.Pane eventKey="reservations">
                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-3">
                  <h6 className="fw-semibold mb-0 text-slate-900">
                    전체 예약 현황 <span className="text-slate-500 fs-7 fw-normal">({filteredReservations.length}건)</span>
                  </h6>
                  <Button variant="outline-primary" size="sm" className="btn-taste-outline" onClick={handleExportCSV}>
                    CSV 엑셀 다운로드
                  </Button>
                </div>

                <div className="mb-3">
                  <Form.Control
                    type="text"
                    placeholder="학번, 학생 이름, 부스명으로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-control-taste"
                  />
                </div>

                <div className="table-responsive">
                  <Table hover className="align-middle text-sm mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: "40px" }}>#</th>
                        <th>학번</th>
                        <th>이름</th>
                        <th>인증번호</th>
                        <th>부스</th>
                        <th>날짜</th>
                        <th>시간대</th>
                        <th style={{ width: "80px" }}>관리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReservations.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="text-center py-5 text-slate-400">
                            예약 내역이 존재하지 않습니다.
                          </td>
                        </tr>
                      ) : (
                        filteredReservations.map((r, idx) => (
                          <tr key={r.id}>
                            <td className="text-slate-400">{idx + 1}</td>
                            <td className="fw-medium font-mono text-slate-900">{r.student_id}</td>
                            <td className="fw-semibold text-slate-900">{r.student_name}</td>
                            <td className="text-slate-500 font-mono">{r.auth_number}</td>
                            <td>
                              <span
                                style={{
                                  display: "inline-block",
                                  background: "#f1f5f9",
                                  color: "#1e293b",
                                  border: "1px solid #e2e8f0",
                                  borderRadius: "4px",
                                  fontSize: "0.75rem",
                                  padding: "0.2rem 0.5rem",
                                  fontWeight: 500,
                                }}
                              >
                                {r.booth_id}
                              </span>
                            </td>
                            <td className="text-slate-600">{r.date}</td>
                            <td className="text-slate-600 font-medium">{r.time_slot}</td>
                            <td>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                className="py-1 px-2 text-xs"
                                onClick={() => handleDeleteReservation(r.id)}
                              >
                                취소
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>
              </Tab.Pane>

            </Tab.Content>
          </Tab.Container>
        )}
      </Modal.Body>

      <Modal.Footer className="bg-white border-top-0 py-2.5 px-4">
        <Button variant="light" className="btn-taste-outline" onClick={onHide}>
          닫기
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AdminModal;
