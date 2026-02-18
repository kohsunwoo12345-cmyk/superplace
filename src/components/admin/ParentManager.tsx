"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Phone, Mail, Edit, Trash2, Star, Loader2 } from "lucide-react";

interface Parent {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship?: string;
  address?: string;
  notes?: string;
  isPrimary?: number;
}

interface ParentManagerProps {
  studentId: string;
  studentName: string;
}

export default function ParentManager({ studentId, studentName }: ParentManagerProps) {
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingParent, setEditingParent] = useState<Parent | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    relationship: "mother",
    address: "",
    notes: "",
    isPrimary: false,
  });

  useEffect(() => {
    fetchParents();
  }, [studentId]);

  const fetchParents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/parents?studentId=${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setParents(data.parents || []);
      }
    } catch (error) {
      console.error("학부모 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddParent = async () => {
    if (!formData.name || !formData.phone) {
      alert("이름과 전화번호는 필수입니다.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/parents", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          studentId,
        }),
      });

      if (response.ok) {
        alert("학부모가 등록되었습니다!");
        setShowAddDialog(false);
        setFormData({
          name: "",
          phone: "",
          email: "",
          relationship: "mother",
          address: "",
          notes: "",
          isPrimary: false,
        });
        fetchParents();
      } else {
        const error = await response.json();
        throw new Error(error.error || "등록 실패");
      }
    } catch (error: any) {
      console.error("학부모 등록 실패:", error);
      alert(error.message || "등록 중 오류가 발생했습니다.");
    }
  };

  const handleEditParent = async () => {
    if (!editingParent || !formData.name || !formData.phone) {
      alert("이름과 전화번호는 필수입니다.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/parents/${editingParent.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("학부모 정보가 수정되었습니다!");
        setShowEditDialog(false);
        setEditingParent(null);
        fetchParents();
      } else {
        const error = await response.json();
        throw new Error(error.error || "수정 실패");
      }
    } catch (error: any) {
      console.error("학부모 수정 실패:", error);
      alert(error.message || "수정 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteParent = async (parentId: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/parents/${parentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        alert("학부모가 삭제되었습니다!");
        fetchParents();
      }
    } catch (error) {
      console.error("학부모 삭제 실패:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const openEditDialog = (parent: Parent) => {
    setEditingParent(parent);
    setFormData({
      name: parent.name,
      phone: parent.phone,
      email: parent.email || "",
      relationship: parent.relationship || "mother",
      address: parent.address || "",
      notes: parent.notes || "",
      isPrimary: !!parent.isPrimary,
    });
    setShowEditDialog(true);
  };

  const getRelationshipLabel = (rel?: string) => {
    const labels: Record<string, string> = {
      father: "아버지",
      mother: "어머니",
      guardian: "보호자",
    };
    return labels[rel || ""] || rel || "기타";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>학부모 정보</CardTitle>
            <CardDescription>{studentName}의 학부모 연락처</CardDescription>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-teal-600 hover:bg-teal-700">
                <UserPlus className="w-4 h-4 mr-2" />
                학부모 추가
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>학부모 추가</DialogTitle>
                <DialogDescription>학생의 학부모 정보를 입력하세요</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>이름 *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="학부모 이름"
                  />
                </div>
                <div>
                  <Label>전화번호 *</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="010-1234-5678"
                  />
                </div>
                <div>
                  <Label>이메일</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <Label>관계</Label>
                  <Select
                    value={formData.relationship}
                    onValueChange={(value) => setFormData({ ...formData, relationship: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mother">어머니</SelectItem>
                      <SelectItem value="father">아버지</SelectItem>
                      <SelectItem value="guardian">보호자</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>주소</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="주소"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isPrimary}
                    onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label>주 연락처로 설정</Label>
                </div>
                <Button onClick={handleAddParent} className="w-full">
                  추가
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {parents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            등록된 학부모가 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {parents.map((parent) => (
              <div
                key={parent.id}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-lg">{parent.name}</span>
                      <Badge variant="outline">{getRelationshipLabel(parent.relationship)}</Badge>
                      {parent.isPrimary === 1 && (
                        <Badge className="bg-yellow-500">
                          <Star className="w-3 h-3 mr-1" />
                          주 연락처
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {parent.phone}
                      </div>
                      {parent.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {parent.email}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(parent)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteParent(parent.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* 수정 다이얼로그 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>학부모 정보 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>이름 *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label>전화번호 *</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label>이메일</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label>관계</Label>
              <Select
                value={formData.relationship}
                onValueChange={(value) => setFormData({ ...formData, relationship: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mother">어머니</SelectItem>
                  <SelectItem value="father">아버지</SelectItem>
                  <SelectItem value="guardian">보호자</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>주소</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <Button onClick={handleEditParent} className="w-full">
              저장
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
