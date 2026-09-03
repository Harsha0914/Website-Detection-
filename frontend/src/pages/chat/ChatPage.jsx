import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Store, Sparkles, PlusCircle } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { ChatBox } from '../../components/chat/ChatBox';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import api from '../../services/api';

export default function ChatPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const conversationType = searchParams.get('type') || 'WEBSITE_IMPROVEMENT';
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBiz = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/businesses/${id}`);
        setBusiness(res.data);
      } catch (err) {
        console.error('Failed to load business', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBiz();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner message="Opening chat session..." />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-4">
          <Link
            to={`/shop/${id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to {business?.name || 'Shop'}</span>
          </Link>
        </div>

        <ChatBox
          business={business}
          conversationType={conversationType}
          onRequestWebsite={() => navigate(`/shop/${id}`)}
        />
      </main>

      <Footer />
    </div>
  );
}
