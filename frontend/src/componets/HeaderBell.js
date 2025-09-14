// src/components/HeaderBell.jsx
import React, { useMemo } from "react";
import { Dropdown, Badge, ListGroup, Button } from "react-bootstrap";
import { FaBell } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchNotifications,
  selectHeaderNotifications,
  selectUnreadHeaderCount,
  markAllRead,
  markAsRead,
  removeNotification,
} from "../redux/notificationsSlice";

function timeSince(iso) {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000; // sn
  if (diff < 60) return `${Math.floor(diff)} sn önce`;
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} sa önce`;
  return d.toLocaleString();
}

export default function HeaderBell() {
  const dispatch = useDispatch();
  const items = useSelector(selectHeaderNotifications);
  const unread = useSelector(selectUnreadHeaderCount);

  const top10 = useMemo(() => items.slice(0, 10), [items]);

  return (
    <Dropdown align="end">
      <Dropdown.Toggle
        variant="link"
        style={{ textDecoration: "none", position: "relative" }}
      >
        <FaBell size={18} />
        {unread > 0 && (
          <Badge bg="danger" pill style={{ position: "absolute", top: -6, right: -6 }}>
            {unread}
          </Badge>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu style={{ minWidth: 360, padding: 0 }}>
        <div className="d-flex justify-content-between align-items-center px-3 py-2">
          <strong>Bildirimler</strong>
          <div className="d-flex gap-2">
            <Button
              size="sm"
              variant="outline-secondary"
              onClick={() => dispatch(markAllRead("header"))}
            >
              Hepsini okundu yap
            </Button>
          </div>
        </div>

        {top10.length === 0 ? (
          <div className="text-center text-muted py-3">Bildirim yok</div>
        ) : (
          <ListGroup variant="flush">
            {top10.map((n) => (
              <ListGroup.Item
                key={n.id}
                className="d-flex align-items-start gap-2"
                style={{ background: n.read ? "inherit" : "#f1f5f9" }}
              >
                <div className="flex-grow-1">
                  <div className="d-flex justify-content-between">
                    <strong>
                      {n.title || (n.type === "success" ? "Başarılı" : "Bildirim")}
                    </strong>
                    <small className="text-muted">{timeSince(n.createdAt)}</small>
                  </div>
                  {n.message && <div className="mt-1">{n.message}</div>}
                </div>
                <div className="d-flex flex-column align-items-end gap-1">
                  {!n.read && (
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => dispatch(markAsRead(n.id))}
                    >
                      Okundu
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={() => dispatch(removeNotification(n.id))}
                  >
                    Sil
                  </Button>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
}
