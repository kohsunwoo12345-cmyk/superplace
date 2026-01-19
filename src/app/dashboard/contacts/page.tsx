"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Mail, 
  Phone, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  MessageSquare,
  Send
} from "lucide-react";

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: string;
  response: string | null;
  respondedBy: string | null;
  respondedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [response, setResponse] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const res = await fetch("/api/contact");
      const data = await res.json();
      setContacts(data.contacts);
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (contactId: string) => {
    if (!response.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/contact/${contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response,
          status: "RESOLVED",
        }),
      });

      if (res.ok) {
        // Refresh contacts
        fetchContacts();
        setSelectedContact(null);
        setResponse("");
      }
    } catch (error) {
      console.error("Failed to respond:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">대기중</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">처리중</Badge>;
      case "RESOLVED":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">완료</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "IN_PROGRESS":
        return <AlertCircle className="h-5 w-5 text-blue-600" />;
      case "RESOLVED":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      default:
        return <MessageSquare className="h-5 w-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">문의 관리</h1>
        <p className="text-gray-600">고객 문의를 확인하고 답변하세요</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">대기중</p>
                <p className="text-2xl font-bold">
                  {contacts.filter((c) => c.status === "PENDING").length}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">처리중</p>
                <p className="text-2xl font-bold">
                  {contacts.filter((c) => c.status === "IN_PROGRESS").length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">완료</p>
                <p className="text-2xl font-bold">
                  {contacts.filter((c) => c.status === "RESOLVED").length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contacts List */}
      <div className="space-y-4">
        {contacts.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">아직 문의가 없습니다</p>
            </CardContent>
          </Card>
        ) : (
          contacts.map((contact) => (
            <Card
              key={contact.id}
              className={`cursor-pointer transition-all ${
                selectedContact?.id === contact.id
                  ? "border-2 border-blue-500"
                  : "hover:shadow-md"
              }`}
              onClick={() => setSelectedContact(contact)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {getStatusIcon(contact.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{contact.subject}</CardTitle>
                        {getStatusBadge(contact.status)}
                      </div>
                      <CardDescription>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <strong>{contact.name}</strong>
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {contact.email}
                          </span>
                          {contact.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              {contact.phone}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(contact.createdAt).toLocaleString("ko-KR")}
                        </p>
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>

              {selectedContact?.id === contact.id && (
                <CardContent className="border-t pt-6">
                  <div className="space-y-6">
                    {/* Message */}
                    <div>
                      <Label className="text-base font-semibold mb-2 block">
                        문의 내용
                      </Label>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {contact.message}
                        </p>
                      </div>
                    </div>

                    {/* Response */}
                    {contact.response ? (
                      <div>
                        <Label className="text-base font-semibold mb-2 block text-green-700">
                          답변 완료
                        </Label>
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <p className="text-gray-700 whitespace-pre-wrap">
                            {contact.response}
                          </p>
                          {contact.respondedAt && (
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(contact.respondedAt).toLocaleString("ko-KR")}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Label htmlFor="response" className="text-base font-semibold mb-2 block">
                          답변 작성
                        </Label>
                        <Textarea
                          id="response"
                          value={response}
                          onChange={(e) => setResponse(e.target.value)}
                          placeholder="답변을 작성해주세요..."
                          rows={6}
                          className="mb-4"
                        />
                        <Button
                          onClick={() => handleRespond(contact.id)}
                          disabled={submitting || !response.trim()}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          {submitting ? (
                            "전송 중..."
                          ) : (
                            <>
                              <Send className="mr-2 h-4 w-4" />
                              답변 전송
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
