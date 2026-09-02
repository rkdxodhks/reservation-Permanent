import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Tab, Nav, Table, Badge, Alert } from "react-bootstrap";
import { toast } from "react-toastify";
import { supabase } from "./supabaseClient";

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

  // Setting form state
  const [formSettings, setFormSettings] = useState(settings);
  const [newDateInput, setNewDateInput] = useState("");

  // Booth form state
  const [boothList, setBoothList] = useState(booths);
  const [newBoothName, setNewBoothName] = useState("");
  const [newBoothDesc, setNewBoothDesc] = useState("");
  const [newBoothColor, setNewBoothColor] = useState("#3b82f6");

  // Reservation search state
  const [searchTerm, setSearchTerm] = useState("");

  // Slot blocking state
  const [selectedBlockBooth, setSelectedBlockBooth] = useState(booths[0]?.name || "");
  const [selectedBlockDate, setSelectedBlockDate] = useState(settings?.event_dates?.[0] || "");

  useEffect(() => {
    setFormSettings(settings);
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
    const correctCode = settings?.admin_passcode || "admin1234";
    if (passcode === correctCode) {
      setIsAuthenticated(true);
      toast.success("관리자 모드로 접속되었습니다.");
    } else {
      toast.error("비밀번호가 일치하지 않습니다.");
    }
  };

  const handleSaveSettings = async () => {
    try {
      const { error } = await supabase
        .from("app_settings")
        .upsert({
          id: 1,
          ...formSettings,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      toast.success("행사 설정이 성공적으로 저장되었습니다.");
      onUpdateSettings(formSettings);
      onRefreshData();
    } catch (err) {
      console.error("Save settings error:", err);
      // Fallback local update
      onUpdateSettings(formSettings);
      toast.info("로컬 설정이 저장되었습니다 (Supabase 연결 확인 필요).");
    }
  };

  const handleAddDate = () => {
    if (!newDateInput) return;
    if (formSettings.event_dates.includes(newDateInput)) {
      toast.warning("이미 존재하지 않는 날짜입니다.");
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

  // Booth handlers
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
      toast.info("로컬 목록에 추가되었습니다.");
    }

    setNewBoothName("");
    setNewBoothDesc("");
  };

  const handleDeleteBooth = async (boothId) => {
    if (!window.confirm("이 부스를 삭제하시겠습니까? 관련 예약 정보 확인이 필요합니다.")) {
      return;
    }
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

  // Admin delete reservation
  const handleDeleteReservation = async (resId) => {
    if (!window.confirm("정말로 이 예약을 강제 취소하시겠습니까?")) return;

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

  // Toggle slot block
  const handleToggleSlotBlock = async (timeSlot) => {
    const isBlocked = slotBlocks.some(
      (b) => b.booth_id === selectedBlockBooth && b.date === selectedBlockDate && b.time_slot === timeSlot
    );

    try {
      if (isBlocked) {
        // Unblock
        const { error } = await supabase
          .from("slot_blocks")
          .delete()
          .match({ booth_id: selectedBlockBooth, date: selectedBlockDate, time_slot: timeSlot });
        if (error) throw error;
        toast.info(`${timeSlot} 슬롯 차단 해제`);
      } else {
        // Block
        const { error } = await supabase.from("slot_blocks").insert([
          {
            booth_id: selectedBlockBooth,
            date: selectedBlockDate,
            time_slot: timeSlot,
            reason: "관리자 예약 차단",
          },
        ]);
        if (error) throw error;
        toast.warn(`${timeSlot} 슬롯 예약 차단 설정`);
      }
      onRefreshData();
    } catch (err) {
      console.error("Toggle block error:", err);
      toast.error(`슬롯 차단 변경 실패: ${err.message}`);
    }
  };

  // CSV Export with UTF-8 BOM
  const handleExportCSV = () => {
    if (!reservations || reservations.length === 0) {
      toast.info("내보낼 예약 데이터가 없습니다.");
      return;
    }

    const headers = ["ID", "학번", "이름", "인증번호", "부스/실험실", "날짜", "시간대", "생성시각"];
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
    link.setAttribute("download", `reservation_list_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("CSV 파일 다운로드가 완료되었습니다.");
  };

  // Filtered reservations
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
    <Modal show={show} onHide={onHide} size="xl" centered backdrop="static" className="admin-modal">
      <Modal.Header closeButton className="bg-dark text-white border-secondary">
        <Modal.Title className="d-flex align-items-center gap-2">
          <span>🛠️ 시스템 관리자 모드 (Admin Portal)</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4 bg-light">
        {!isAuthenticated ? (
          <Form onSubmit={handleLogin} className="max-w-md mx-auto py-5 text-center">
            <h4 className="mb-3 fw-bold">관리자 인증</h4>
            <p className="text-muted mb-4">시크릿 코드를 입력하여 관리자 시스템에 접속하세요.</p>
            <Form.Group className="mb-3">
              <Form.Control
                type="password"
                placeholder="관리자 암호 입력 (기본: admin1234)"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                autoFocus
                className="form-control-lg text-center"
              />
            </Form.Group>
            <Button type="submit" variant="primary" size="lg" className="w-100">
              접속하기
            </Button>
          </Form>
        ) : (
          <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
            <Nav variant="pills" className="mb-4 bg-white p-2 rounded shadow-sm border gap-2">
              <Nav.Item>
                <Nav.Link eventKey="settings">⚙️ 행사 기본 설정</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="booths">🧪 부스/실험실 관리</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="blocking">⏰ 슬롯 차단/블록</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="reservations">
                  📋 전체 예약자 관리 <Badge bg="primary">{reservations.length}</Badge>
                </Nav.Link>
              </Nav.Item>
            </Nav>

            <Tab.Content className="bg-white p-4 rounded shadow-sm border">
              {/* TAB 1: EVENT SETTINGS */}
              <Tab.Pane eventKey="settings">
                <h5 className="fw-bold mb-4 border-bottom pb-2">행사 기본 정보 및 정책 커스터마이징</h5>
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">행사 제목</Form.Label>
                    <Form.Control
                      type="text"
                      value={formSettings.event_title || ""}
                      onChange={(e) => setFormSettings({ ...formSettings, event_title: e.target.value })}
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold">행사 운영 날짜 목록</Form.Label>
                    <div className="d-flex flex-wrap gap-2 mb-2">
                      {formSettings.event_dates?.map((d) => (
                        <Badge key={d} bg="secondary" className="p-2 fs-6 d-flex align-items-center gap-2">
                          {d}
                          <span
                            style={{ cursor: "pointer", color: "#ff6b6b" }}
                            onClick={() => handleRemoveDate(d)}
                            title="날짜 삭제"
                          >
                            ✕
                          </span>
                        </Badge>
                      ))}
                    </div>
                    <div className="d-flex gap-2 max-w-sm">
                      <Form.Control
                        type="date"
                        value={newDateInput}
                        onChange={(e) => setNewDateInput(e.target.value)}
                      />
                      <Button variant="outline-primary" onClick={handleAddDate}>
                        날짜 추가
                      </Button>
                    </div>
                  </Form.Group>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <Form.Group>
                        <Form.Label className="fw-bold">1인당 최대 예약 가능 횟수</Form.Label>
                        <Form.Control
                          type="number"
                          min="1"
                          max="10"
                          value={formSettings.max_reservations_per_student || 2}
                          onChange={(e) =>
                            setFormSettings({
                              ...formSettings,
                              max_reservations_per_student: parseInt(e.target.value) || 1,
                            })
                          }
                        />
                      </Form.Group>
                    </div>
                    <div className="col-md-6">
                      <Form.Group>
                        <Form.Label className="fw-bold">타임슬롯당 최대 정원</Form.Label>
                        <Form.Control
                          type="number"
                          min="1"
                          max="20"
                          value={formSettings.max_capacity_per_slot || 2}
                          onChange={(e) =>
                            setFormSettings({
                              ...formSettings,
                              max_capacity_per_slot: parseInt(e.target.value) || 1,
                            })
                          }
                        />
                      </Form.Group>
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-4">
                      <Form.Group>
                        <Form.Label className="fw-bold">운영 시작 시간</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="10:00"
                          value={formSettings.start_time || "10:00"}
                          onChange={(e) => setFormSettings({ ...formSettings, start_time: e.target.value })}
                        />
                      </Form.Group>
                    </div>
                    <div className="col-md-4">
                      <Form.Group>
                        <Form.Label className="fw-bold">운영 종료 시간</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="16:00"
                          value={formSettings.end_time || "16:00"}
                          onChange={(e) => setFormSettings({ ...formSettings, end_time: e.target.value })}
                        />
                      </Form.Group>
                    </div>
                    <div className="col-md-4">
                      <Form.Group>
                        <Form.Label className="fw-bold">슬롯 시간 간격 (분)</Form.Label>
                        <Form.Select
                          value={formSettings.slot_interval || 20}
                          onChange={(e) =>
                            setFormSettings({
                              ...formSettings,
                              slot_interval: parseInt(e.target.value),
                            })
                          }
                        >
                          <option value={10}>10분 간격</option>
                          <option value={15}>15분 간격</option>
                          <option value={20}>20분 간격 (기본)</option>
                          <option value={30}>30분 간격</option>
                          <option value={60}>60분 간격</option>
                        </Form.Select>
                      </Form.Group>
                    </div>
                  </div>

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold">관리자 접속 암호 변경</Form.Label>
                    <Form.Control
                      type="text"
                      value={formSettings.admin_passcode || "admin1234"}
                      onChange={(e) => setFormSettings({ ...formSettings, admin_passcode: e.target.value })}
                    />
                  </Form.Group>

                  <Button variant="primary" size="lg" onClick={handleSaveSettings}>
                    💾 설정 저장하기
                  </Button>
                </Form>
              </Tab.Pane>

              {/* TAB 2: BOOTHS MANAGER */}
              <Tab.Pane eventKey="booths">
                <h5 className="fw-bold mb-3 border-bottom pb-2">부스 / 실험실 목록 관리</h5>

                {/* Add new booth form */}
                <div className="bg-light p-3 rounded border mb-4">
                  <h6 className="fw-bold mb-3">➕ 새 부스 추가</h6>
                  <div className="row g-2 mb-2">
                    <div className="col-md-5">
                      <Form.Control
                        type="text"
                        placeholder="부스 / 실험실 이름"
                        value={newBoothName}
                        onChange={(e) => setNewBoothName(e.target.value)}
                      />
                    </div>
                    <div className="col-md-5">
                      <Form.Control
                        type="text"
                        placeholder="부스 간단 설명"
                        value={newBoothDesc}
                        onChange={(e) => setNewBoothDesc(e.target.value)}
                      />
                    </div>
                    <div className="col-md-2 d-flex gap-2">
                      <Form.Control
                        type="color"
                        value={newBoothColor}
                        onChange={(e) => setNewBoothColor(e.target.value)}
                        title="태그 컬러"
                      />
                      <Button variant="success" className="w-100" onClick={handleAddBooth}>
                        추가
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Booth list table */}
                <Table responsive hover className="align-middle">
                  <thead className="table-secondary">
                    <tr>
                      <th style={{ width: "50px" }}>#</th>
                      <th>부스 명칭</th>
                      <th>설명</th>
                      <th>태그 컬러</th>
                      <th style={{ width: "100px" }}>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {boothList.map((b, idx) => (
                      <tr key={b.id || idx}>
                        <td>{idx + 1}</td>
                        <td className="fw-bold">{b.name}</td>
                        <td className="text-muted">{b.description || "-"}</td>
                        <td>
                          <span
                            className="badge p-2"
                            style={{ backgroundColor: b.color_tag || "#3b82f6", color: "#fff" }}
                          >
                            {b.color_tag}
                          </span>
                        </td>
                        <td>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteBooth(b.id)}
                          >
                            삭제
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Tab.Pane>

              {/* TAB 3: SLOT BLOCKING */}
              <Tab.Pane eventKey="blocking">
                <h5 className="fw-bold mb-3 border-bottom pb-2">특정 시간대 예약 차단 (Block)</h5>
                <Alert variant="info" className="py-2">
                  클릭 시 해당 슬롯의 예약을 즉시 금지/차단 상태로 변경합니다.
                </Alert>

                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <Form.Label className="fw-bold">대상 부스 선택</Form.Label>
                    <Form.Select
                      value={selectedBlockBooth}
                      onChange={(e) => setSelectedBlockBooth(e.target.value)}
                    >
                      {booths.map((b) => (
                        <option key={b.name} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                  <div className="col-md-6">
                    <Form.Label className="fw-bold">대상 날짜 선택</Form.Label>
                    <Form.Select
                      value={selectedBlockDate}
                      onChange={(e) => setSelectedBlockDate(e.target.value)}
                    >
                      {settings?.event_dates?.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                </div>

                <h6 className="fw-bold mb-2">슬롯 예약 차단 조절</h6>
                <div className="d-flex flex-wrap gap-2">
                  {/* Slots list */}
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
                        className="px-3 py-2"
                        onClick={() => handleToggleSlotBlock(slot)}
                      >
                        {slot} {isBlocked ? "🔒 (차단됨)" : "✅ (가능)"}
                      </Button>
                    );
                  })}
                </div>
              </Tab.Pane>

              {/* TAB 4: RESERVATION MANAGEMENT */}
              <Tab.Pane eventKey="reservations">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold mb-0">전체 예약 현황 목록</h5>
                  <Button variant="success" onClick={handleExportCSV}>
                    📥 CSV 엑셀 다운로드
                  </Button>
                </div>

                <div className="mb-3">
                  <Form.Control
                    type="text"
                    placeholder="학번, 학생 이름, 부스명으로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <Table responsive hover className="align-middle fs-6">
                  <thead className="table-dark">
                    <tr>
                      <th>#</th>
                      <th>학번</th>
                      <th>이름</th>
                      <th>인증번호</th>
                      <th>부스</th>
                      <th>날짜</th>
                      <th>시간대</th>
                      <th>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReservations.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center py-4 text-muted">
                          예약 데이터가 존재하지 않습니다.
                        </td>
                      </tr>
                    ) : (
                      filteredReservations.map((r, idx) => (
                        <tr key={r.id}>
                          <td>{idx + 1}</td>
                          <td className="fw-bold">{r.student_id}</td>
                          <td>{r.student_name}</td>
                          <td>{r.auth_number}</td>
                          <td>
                            <Badge bg="primary">{r.booth_id}</Badge>
                          </td>
                          <td>{r.date}</td>
                          <td>{r.time_slot}</td>
                          <td>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeleteReservation(r.id)}
                            >
                              강제 취소
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        )}
      </Modal.Body>
      <Modal.Footer className="bg-white">
        <Button variant="secondary" onClick={onHide}>
          닫기
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AdminModal;
