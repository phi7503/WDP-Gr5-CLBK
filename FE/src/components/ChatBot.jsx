import React, { useState, useEffect, useRef } from "react";
import { Button, Drawer, Input, Space, Typography, Card, Spin, Empty } from "antd";
import {
  MessageOutlined,
  SendOutlined,
  DeleteOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import { chatAPI, getImageUrl } from "../services/api";

const { Text, Paragraph } = Typography;

const ChatBot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    // Load session từ localStorage khi component mount
    const savedSessionId = localStorage.getItem("chatSessionId");
    if (savedSessionId) {
      setSessionId(savedSessionId);
      loadHistory(savedSessionId);
    } else {
      // Welcome message nếu chưa có session
      setMessages([
        {
          role: "assistant",
          content:
            "Xin chào! 👋 Tôi là **CineMate**, chuyên gia tư vấn phim của CineLink. Tôi có thể giúp bạn tìm phim phù hợp dựa trên sở thích của bạn. Bạn muốn xem phim gì hôm nay?",
          timestamp: new Date(),
        },
      ]);
    }
  }, []);

  useEffect(() => {
    // Auto scroll to bottom khi có message mới
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadHistory = async (sessionId) => {
    try {
      setLoadingHistory(true);
      const history = await chatAPI.getHistory(sessionId);
      if (history.messages && history.messages.length > 0) {
        // Populate recommendedMovies nếu có
        const formattedMessages = history.messages.map((msg) => ({
          ...msg,
          recommendedMovies: msg.recommendedMovies || [],
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error("Error loading history:", error);
      // Nếu không load được, hiển thị welcome message
      setMessages([
        {
          role: "assistant",
          content:
            "Xin chào! 👋 Tôi là **CineMate**, chuyên gia tư vấn phim của CineLink. Tôi có thể giúp bạn tìm phim phù hợp dựa trên sở thích của bạn. Bạn muốn xem phim gì hôm nay?",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage = inputValue.trim();
    setInputValue("");

    // Thêm user message vào UI ngay lập tức
    const newUserMessage = {
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newUserMessage]);

    // Thêm loading message
    setLoading(true);
    const loadingMessage = {
      role: "assistant",
      content: "Đang suy nghĩ...",
      timestamp: new Date(),
      isLoading: true,
    };
    setMessages((prev) => [...prev, loadingMessage]);

    try {
      const response = await chatAPI.sendMessage({
        message: userMessage,
        sessionId,
      });

      // Lưu sessionId
      if (response.sessionId) {
        setSessionId(response.sessionId);
        localStorage.setItem("chatSessionId", response.sessionId);
      }

      // Xóa loading message và thêm response thực tế
      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.isLoading);
        return [
          ...filtered,
          {
            role: "assistant",
            content: response.response,
            recommendedMovies: response.recommendedMovies || [],
            timestamp: new Date(),
          },
        ];
      });
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.isLoading);
        return [
          ...filtered,
          {
            role: "assistant",
            content:
              "Xin lỗi, tôi gặp sự cố. Vui lòng thử lại sau hoặc kiểm tra kết nối mạng.",
            timestamp: new Date(),
          },
        ];
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!sessionId) return;
    try {
      await chatAPI.clearHistory(sessionId);
      setMessages([
        {
          role: "assistant",
          content:
            "Lịch sử đã được xóa. Bạn muốn xem phim gì hôm nay?",
          timestamp: new Date(),
        },
      ]);
      localStorage.removeItem("chatSessionId");
      setSessionId(null);
    } catch (error) {
      console.error("Error clearing history:", error);
    }
  };

  const quickActions = [
    "Phim hành động",
    "Phim tình cảm",
    "Phim kinh dị",
    "Phim hài",
    "Phim đang hot",
  ];

  const handleQuickAction = (action) => {
    setInputValue(action);
    // Auto send
    setTimeout(() => {
      handleSend();
    }, 100);
  };

  return (
    <>
      {/* Floating Button */}
      <Button
        type="primary"
        shape="circle"
        size="large"
        icon={<MessageOutlined />}
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          zIndex: 1000,
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        }}
      />

      {/* Chat Drawer */}
      <Drawer
        title={
          <Space>
            <MessageOutlined style={{ color: "#1890ff" }} />
            <Text strong style={{ fontSize: 16 }}>
              CineMate - Tư vấn phim
            </Text>
          </Space>
        }
        placement="right"
        onClose={() => setOpen(false)}
        open={open}
        width={420}
        extra={
          sessionId && (
            <Button
              icon={<DeleteOutlined />}
              onClick={handleClearHistory}
              danger
              size="small"
            >
              Xóa lịch sử
            </Button>
          )
        }
        styles={{
          body: {
            padding: 0,
            display: "flex",
            flexDirection: "column",
            height: "100%",
          },
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          {/* Messages Area */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
              marginBottom: 16,
              backgroundColor: "#fafafa",
            }}
          >
            {loadingHistory ? (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <Spin size="large" />
              </div>
            ) : messages.length === 0 ? (
              <Empty description="Chưa có tin nhắn nào" />
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    marginBottom: 16,
                    display: "flex",
                    justifyContent:
                      msg.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "85%",
                      padding: "12px 16px",
                      borderRadius: 12,
                      backgroundColor:
                        msg.role === "user"
                          ? "#1890ff"
                          : "#ffffff",
                      color: msg.role === "user" ? "white" : "black",
                      boxShadow:
                        msg.role === "user"
                          ? "0 2px 8px rgba(24,144,255,0.3)"
                          : "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                  >
                    {msg.isLoading ? (
                      <Spin size="small" />
                    ) : (
                      <Paragraph
                        style={{
                          margin: 0,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          color: msg.role === "user" ? "white" : "black",
                        }}
                      >
                        {msg.content}
                      </Paragraph>
                    )}

                    {/* Hiển thị phim được gợi ý */}
                    {msg.recommendedMovies &&
                      msg.recommendedMovies.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                          <Text
                            strong
                            style={{
                              fontSize: 12,
                              color: msg.role === "user" ? "white" : "#1890ff",
                              display: "block",
                              marginBottom: 8,
                            }}
                          >
                            🎬 Phim được gợi ý:
                          </Text>
                          {msg.recommendedMovies.map((movie) => (
                            <Link
                              key={movie._id}
                              to={`/movies/${movie._id}`}
                              onClick={() => setOpen(false)}
                              style={{ textDecoration: "none" }}
                            >
                              <Card
                                hoverable
                                style={{
                                  marginBottom: 8,
                                  borderRadius: 8,
                                  border: "1px solid #e8e8e8",
                                }}
                                bodyStyle={{ padding: 12 }}
                                cover={
                                  <img
                                    alt={movie.title}
                                    src={getImageUrl(movie.poster)}
                                    style={{
                                      height: 120,
                                      objectFit: "cover",
                                      width: "100%",
                                    }}
                                    onError={(e) => {
                                      e.target.src =
                                        "https://via.placeholder.com/300x400?text=No+Image";
                                    }}
                                  />
                                }
                              >
                                <Card.Meta
                                  title={
                                    <Text
                                      strong
                                      ellipsis
                                      style={{ fontSize: 13 }}
                                    >
                                      {movie.title}
                                    </Text>
                                  }
                                  description={
                                    <div>
                                      <Text
                                        ellipsis
                                        style={{ fontSize: 11, color: "#666" }}
                                      >
                                        {movie.description?.substring(0, 60)}...
                                      </Text>
                                      <div style={{ marginTop: 4 }}>
                                        {movie.genre?.slice(0, 2).map((g, i) => (
                                          <span
                                            key={i}
                                            style={{
                                              fontSize: 10,
                                              padding: "2px 6px",
                                              backgroundColor: "#f0f0f0",
                                              borderRadius: 4,
                                              marginRight: 4,
                                            }}
                                          >
                                            {g}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  }
                                />
                              </Card>
                            </Link>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions (chỉ hiển thị khi chưa có nhiều messages) */}
          {messages.length <= 2 && (
            <div
              style={{
                padding: "8px 16px",
                borderTop: "1px solid #e8e8e8",
                borderBottom: "1px solid #e8e8e8",
              }}
            >
              <Text
                type="secondary"
                style={{ fontSize: 12, display: "block", marginBottom: 8 }}
              >
                Gợi ý nhanh:
              </Text>
              <Space wrap size={[8, 8]}>
                {quickActions.map((action, idx) => (
                  <Button
                    key={idx}
                    size="small"
                    onClick={() => handleQuickAction(action)}
                    style={{ fontSize: 11 }}
                  >
                    {action}
                  </Button>
                ))}
              </Space>
            </div>
          )}

          {/* Input Area */}
          <div style={{ padding: "16px", borderTop: "1px solid #e8e8e8" }}>
            <Space.Compact style={{ width: "100%" }}>
              <Input
                placeholder="Nhập tin nhắn..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onPressEnter={handleSend}
                disabled={loading}
                size="large"
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSend}
                loading={loading}
                size="large"
              >
                Gửi
              </Button>
            </Space.Compact>
          </div>
        </div>
      </Drawer>
    </>
  );
};

export default ChatBot;

