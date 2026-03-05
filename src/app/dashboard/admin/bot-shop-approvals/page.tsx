'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle, Eye, Search, Filter } from 'lucide-react';

interface PurchaseRequest {
  id: string;
  productId: string;
  productName: string;
  userId: string;
  academyId: string;
  studentCount: number;
  months: number;
  pricePerStudent: number;
  totalPrice: number;
  email: string;
  name: string;
  requestAcademyName: string;
  phoneNumber: string;
  requestMessage: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  userName?: string;
  userEmail?: string;
  academyName?: string;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  totalRevenue: number;
}

export default function BotShopApprovalsPage() {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [approving, setApproving] = useState(false);
  const [approvedStudentCount, setApprovedStudentCount] = useState<number>(0);
  const [rejectionReason, setRejectionReason] = useState('');
  const [academies, setAcademies] = useState<any[]>([]);
  const [selectedAcademyId, setSelectedAcademyId] = useState<string>('');

  useEffect(() => {
    loadRequests();
    loadAcademies();
  }, [statusFilter]);

  const loadAcademies = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/academies', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAcademies(data.academies || []);
      }
    } catch (error) {
      console.error('Failed to load academies:', error);
    }
  };

  const loadRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const url = statusFilter === 'ALL' 
        ? '/api/admin/bot-purchase-requests/list'
        : `/api/admin/bot-purchase-requests/list?status=${statusFilter}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data.data.requests || []);
        setStats(data.data.stats || {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          totalRevenue: 0
        });
      } else {
        console.error('Failed to load requests');
      }
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string, studentCount: number, academyId: string) => {
    if (!academyId) {
      alert('학원을 선택해주세요.');
      return;
    }

    if (!confirm(`${studentCount}명으로 승인하시겠습니까?`)) {
      return;
    }

    setApproving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/bot-purchase-requests/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          requestId,
          studentCount,
          academyId
        })
      });

      if (response.ok) {
        alert('✅ 승인되었습니다!');
        setShowModal(false);
        setSelectedRequest(null);
        loadRequests();
      } else {
        const error = await response.json();
        alert(`승인 실패: ${error.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('Approval error:', error);
      alert('승인 처리 중 오류가 발생했습니다.');
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async (requestId: string, reason: string) => {
    if (!reason.trim()) {
      alert('거절 사유를 입력해주세요.');
      return;
    }

    if (!confirm('정말 거절하시겠습니까?')) {
      return;
    }

    setApproving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/bot-purchase-requests/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          requestId,
          rejectionReason: reason
        })
      });

      if (response.ok) {
        alert('❌ 거절되었습니다.');
        setShowModal(false);
        setSelectedRequest(null);
        setRejectionReason('');
        loadRequests();
      } else {
        const error = await response.json();
        alert(`거절 실패: ${error.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('Rejection error:', error);
      alert('거절 처리 중 오류가 발생했습니다.');
    } finally {
      setApproving(false);
    }
  };

  const openModal = (request: PurchaseRequest) => {
    setSelectedRequest(request);
    setApprovedStudentCount(request.studentCount);
    setSelectedAcademyId(request.academyId !== 'external' ? request.academyId : '');
    setRejectionReason('');
    setShowModal(true);
  };

  const filteredRequests = requests.filter(req => {
    const searchLower = searchQuery.toLowerCase();
    return (
      req.productName.toLowerCase().includes(searchLower) ||
      req.name?.toLowerCase().includes(searchLower) ||
      req.email?.toLowerCase().includes(searchLower) ||
      req.requestAcademyName?.toLowerCase().includes(searchLower) ||
      req.phoneNumber?.includes(searchQuery)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium flex items-center gap-1">
          <Clock className="w-4 h-4" /> 대기중
        </span>;
      case 'APPROVED':
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
          <CheckCircle className="w-4 h-4" /> 승인됨
        </span>;
      case 'REJECTED':
        return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium flex items-center gap-1">
          <XCircle className="w-4 h-4" /> 거절됨
        </span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI 쇼핑몰 구매 승인 관리</h1>
        <p className="text-gray-600">학원의 AI 봇 구매 신청을 승인하거나 거절할 수 있습니다.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
          <div className="text-sm text-gray-600">전체</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-yellow-500">
          <div className="text-sm text-gray-600">대기중</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
          <div className="text-sm text-gray-600">승인됨</div>
          <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500">
          <div className="text-sm text-gray-600">거절됨</div>
          <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500">
          <div className="text-sm text-gray-600">총 매출</div>
          <div className="text-xl font-bold text-purple-600">
            ₩{stats.totalRevenue.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">전체</option>
              <option value="PENDING">대기중</option>
              <option value="APPROVED">승인됨</option>
              <option value="REJECTED">거절됨</option>
            </select>
          </div>

          {/* Search */}
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="제품명, 이름, 이메일, 학원, 연락처로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={loadRequests}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            새로고침
          </button>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            로딩 중...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            구매 신청이 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제품</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">신청자 정보</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">학원</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">학생 수</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">기간</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">총 금액</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">신청일</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900">{request.productName}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{request.name || '-'}</div>
                        <div className="text-gray-500">{request.email || '-'}</div>
                        <div className="text-gray-500">{request.phoneNumber || '-'}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">{request.requestAcademyName || request.academyName || '-'}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="font-medium text-blue-600">{request.studentCount}명</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="font-medium">{request.months}개월</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="font-semibold text-gray-900">₩{request.totalPrice.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(request.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <button
                        onClick={() => openModal(request)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        상세
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">구매 신청 상세</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 space-y-6">
              {/* Status */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">상태</label>
                <div>{getStatusBadge(selectedRequest.status)}</div>
              </div>

              {/* Product Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">제품 정보</h3>
                <div className="space-y-1 text-sm">
                  <div><span className="font-medium">제품명:</span> {selectedRequest.productName}</div>
                  <div><span className="font-medium">학생 수:</span> {selectedRequest.studentCount}명</div>
                  <div><span className="font-medium">이용 기간:</span> {selectedRequest.months}개월</div>
                  <div><span className="font-medium">월 단가:</span> ₩{selectedRequest.pricePerStudent.toLocaleString()}</div>
                  <div className="pt-2 border-t border-blue-200">
                    <span className="font-bold text-lg text-blue-600">총 금액: ₩{selectedRequest.totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Applicant Info */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">신청자 정보</h3>
                <div className="space-y-1 text-sm">
                  <div><span className="font-medium">이름:</span> {selectedRequest.name || '-'}</div>
                  <div><span className="font-medium">이메일:</span> {selectedRequest.email || '-'}</div>
                  <div><span className="font-medium">학원 이름:</span> {selectedRequest.requestAcademyName || '-'}</div>
                  <div><span className="font-medium">연락처:</span> {selectedRequest.phoneNumber || '-'}</div>
                </div>
              </div>

              {/* Request Message */}
              {selectedRequest.requestMessage && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">요청사항</label>
                  <div className="bg-gray-50 p-3 rounded text-sm text-gray-700">
                    {selectedRequest.requestMessage}
                  </div>
                </div>
              )}

              {/* Rejection Reason */}
              {selectedRequest.status === 'REJECTED' && selectedRequest.rejectionReason && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">거절 사유</label>
                  <div className="bg-red-50 p-3 rounded text-sm text-red-700">
                    {selectedRequest.rejectionReason}
                  </div>
                </div>
              )}

              {/* Actions for PENDING status */}
              {selectedRequest.status === 'PENDING' && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      학원 선택 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedAcademyId}
                      onChange={(e) => setSelectedAcademyId(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">학원을 선택하세요</option>
                      {academies.map((academy) => (
                        <option key={academy.id} value={academy.id}>
                          {academy.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      봇이 할당될 학원을 선택하세요
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      승인할 학생 수 (수정 가능)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={approvedStudentCount}
                      onChange={(e) => setApprovedStudentCount(Number(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      신청 학생 수: {selectedRequest.studentCount}명
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      거절 사유 (거절 시 필수)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                      placeholder="거절 사유를 입력하세요..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(selectedRequest.id, approvedStudentCount, selectedAcademyId)}
                      disabled={approving}
                      className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      {approving ? '처리 중...' : '승인'}
                    </button>
                    <button
                      onClick={() => handleReject(selectedRequest.id, rejectionReason)}
                      disabled={approving}
                      className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 font-medium flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-5 h-5" />
                      {approving ? '처리 중...' : '거절'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
