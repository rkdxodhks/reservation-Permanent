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

  const [formSettings, setFormSettings] = useState(settings);
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
    const configurableCode = settings?.admin_passcode || "admin1234";
    // Check both Master Code (202345603) and Configured Code
    if (passcode === MASTER_ADMIN_PASSCODE || passcode === configurableCode) {
      setIsAuthenticated(true);
      toast.success("관리자 포털에 접속되었습니다.");
    } else {
      toast.error("관리자 비밀번호가 일치하지 않습니다.");
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
      onUpdateSettings(formSettings);
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
    if (!window.confirm("예약을 강제 취소하시겠습니까?")) return;

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
        toast.info(`${timeSlot} 슬롯 차단 해제`);
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
        toast.warn(`${timeSlot} 슬롯 차단 설정`);
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
    link.setAttribute("download", `reservation_list_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("CSV 파일 다운로드가 완료되었습니다.");
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
      <Modal.Header closeButton className="bg-slate-900 text-white border-slate-800 py-3 px-4">
        <Modal.Title className="h6 fw-semibold mb-0">
          시스템 관리자 포털
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4 bg-slate-50">
        {!isAuthenticated ? (
          <Form onSubmit={handleLogin} className="max-w-md mx-auto py-5 text-center">
            <h5 className="mb-2 fw-semibold text-slate-900">관리자 인증</h5>
            <p className="text-slate-500 mb-4 text-sm">관리자 암호를 입력해 주세요.</p>
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
            <Button type="submit" variant="primary" className="btn-taste-primary w-100 py-2.5">
              접속하기
            </Button>
          </Form>
        ) : (
          <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
            <Nav variant="pills" className="mb-4 bg-white p-1.5 rounded-3 border gap-1">
              <Nav.Item>
                <Nav.Link eventKey="settings" className="taste-tab-link">행사 설정</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="booths" className="taste-tab-link">부스 관리</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="blocking" className="taste-tab-link">슬롯 차단</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="reservations" className="taste-tab-link d-flex align-items-center gap-2">
                  <span>예약자 관리</span>
                  <Badge bg="secondary" className="font-mono">{reservations.length}</Badge>
                </Nav.Link>
              </Nav.Item>
            </Nav>

            <Tab.Content className="bg-white p-4 rounded-3 border shadow-xs">
              {/* TAB 1 */}
              <Tab.Pane eventKey="settings">
                <h6 className="fw-semibold mb-4 border-bottom pb-2 text-slate-900">행사 기본 정보 및 정책</h6>
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label className="form-label-taste">행사 제목</Form.Label>
                    <Form.Control
                      type="text"
                      value={formSettings.event_title || ""}
                      onChange={(e) => setFormSettings({ ...formSettings, event_title: e.target.value })}
                      className="form-control-taste"
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="form-label-taste">행사 운영 날짜</Form.Label>
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
                      <Button variant="outline-secondary" size="sm" className="btn-taste-outline" onClick={handleAddDate}>
                        날짜 추가
                      </Button>
                    </div>
                  </Form.Group>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <Form.Group>
                        <Form.Label className="form-label-taste">1인당 최대 예약 가능 횟수</Form.Label>
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
                          className="form-control-taste"
                        />
                      </Form.Group>
                    </div>
                    <div className="col-md-6">
                      <Form.Group>
                        <Form.Label className="form-label-taste">슬롯당 최대 정원</Form.Label>
                        <Form.Control
                          type="number"
                          min="1"
                          max="20"
                          value={formSettings.max_capacity_per_slot || 1}
                          onChange={(e) =>
                            setFormSettings({
                              ...formSettings,
                              max_capacity_per_slot: parseInt(e.target.value) || 1,
                            })
                          }
                          className="form-control-taste"
                        />
                      </Form.Group>
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
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
                        <Form.Label className="form-label-taste">슬롯 간격 (분)</Form.Label>
                        <Form.Select
                          value={formSettings.slot_interval || 20}
                          onChange={(e) =>
                            setFormSettings({
                              ...formSettings,
                              slot_interval: parseInt(e.target.value),
                            })
                          }
                          className="form-control-taste"
                        >
                          <option value={10}>10분</option>
                          <option value={15}>15분</option>
                          <option value={20}>20분</option>
                          <option value={30}>30분</option>
                          <option value={60}>60분</option>
                        </Form.Select>
                      </Form.Group>
                    </div>
                  </div>

                  <Form.Group className="mb-4">
                    <Form.Label className="form-label-taste">일반 관리자 암호 변경</Form.Label>
                    <Form.Control
                      type="text"
                      value={formSettings.admin_passcode || "admin1234"}
                      onChange={(e) => setFormSettings({ ...formSettings, admin_passcode: e.target.value })}
                      className="form-control-taste"
                    />
                    <Form.Text className="text-slate-500 text-xs">
                      * 고정 마스터 관리자 번호 (202345603)는 언제나 항상 작동합니다.
                    </Form.Text>
                  </Form.Group>

                  <Button variant="primary" className="btn-taste-primary" onClick={handleSaveSettings}>
                    설정 저장
                  </Button>
                </Form>
              </Tab.Pane>

              {/* TAB 2 */}
              <Tab.Pane eventKey="booths">
                <h6 className="fw-semibold mb-3 border-bottom pb-2 text-slate-900">부스 목록 관리</h6>

                <div className="bg-slate-50 p-3 rounded-3 border mb-4">
                  <h6 className="fw-semibold mb-3 text-xs text-slate-600">새 부스 추가</h6>
                  <div className="row g-2 mb-2">
                    <div className="col-md-5">
                      <Form.Control
                        type="text"
                        placeholder="부스 이름"
                        value={newBoothName}
                        onChange={(e) => setNewBoothName(e.target.value)}
                        className="form-control-taste"
                      />
                    </div>
                    <div className="col-md-5">
                      <Form.Control
                        type="text"
                        placeholder="부스 설명"
                        value={newBoothDesc}
                        onChange={(e) => setNewBoothDesc(e.target.value)}
                        className="form-control-taste"
                      />
                    </div>
                    <div className="col-md-2 d-flex gap-2">
                      <Form.Control
                        type="color"
                        value={newBoothColor}
                        onChange={(e) => setNewBoothColor(e.target.value)}
                        className="form-control-taste p-1"
                      />
                      <Button variant="primary" className="btn-taste-primary w-100" onClick={handleAddBooth}>
                        추가
                      </Button>
                    </div>
                  </div>
                </div>

                <Table responsive hover className="align-middle text-sm">
                  <thead className="table-light">
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
                        <td className="fw-medium text-slate-900">{b.name}</td>
                        <td className="text-slate-500">{b.description || "-"}</td>
                        <td>
                          <span
                            className="badge px-2 py-1"
                            style={{ backgroundColor: b.color_tag || "#2563eb", color: "#fff" }}
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

              {/* TAB 3 */}
              <Tab.Pane eventKey="blocking">
                <h6 className="fw-semibold mb-3 border-bottom pb-2 text-slate-900">슬롯 예약 차단 설정</h6>
                <Alert variant="secondary" className="py-2 text-sm bg-slate-100 border text-slate-700">
                  슬롯을 클릭하면 해당 시간대의 예약을 즉시 금지/차단합니다.
                </Alert>

                <div className="row g-3 mb-4">
                  <div className="col-md-6">
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
                  <div className="col-md-6">
                    <Form.Label className="form-label-taste">날짜 선택</Form.Label>
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
                        className="px-3 py-2 text-sm"
                        onClick={() => handleToggleSlotBlock(slot)}
                      >
                        {slot} {isBlocked ? "(차단됨)" : "(가능)"}
                      </Button>
                    );
                  })}
                </div>
              </Tab.Pane>

              {/* TAB 4 */}
              <Tab.Pane eventKey="reservations">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-semibold mb-0 text-slate-900">전체 예약 현황</h6>
                  <Button variant="outline-primary" size="sm" className="btn-taste-outline" onClick={handleExportCSV}>
                    CSV 엑셀 다운로드
                  </Button>
                </div>

                <div className="mb-3">
                  <Form.Control
                    type="text"
                    placeholder="학번, 이름, 부스명으로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-control-taste"
                  />
                </div>

                <Table responsive hover className="align-middle text-sm">
                  <thead className="table-light">
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
                        <td colSpan="8" className="text-center py-4 text-slate-400">
                          예약 데이터가 존재하지 않습니다.
                        </td>
                      </tr>
                    ) : (
                      filteredReservations.map((r, idx) => (
                        <tr key={r.id}>
                          <td>{idx + 1}</td>
                          <td className="fw-medium font-mono">{r.student_id}</td>
                          <td>{r.student_name}</td>
                          <td>{r.auth_number}</td>
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
      <Modal.Footer className="bg-white border-top-0">
        <Button variant="light" onClick={onHide}>
          닫기
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AdminModal;
