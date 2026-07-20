import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getModel, PIPELINE_TAGS, classifyLicense } from '@/api/huggingface';
import { FiDownload, FiHeart, FiClock, FiTag, FiExternalLink, FiArrowLeft } from 'react-icons/fi';
import { HiOutlineSparkles } from 'react-icons/hi2';
import { formatNumber } from '@/utils/format';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function ModelDetailPage() {
  const { modelId } = useParams();
  const decodedId = decodeURIComponent(modelId);
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getModel(decodedId);
        setModel(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [decodedId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-pulse space-y-4">
        <div className="h-6 w-48 skeleton" />
        <div className="h-4 w-96 skeleton" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 skeleton rounded-2xl" />)}
        </div>
        <div className="h-64 skeleton rounded-2xl" />
      </div>
    );
  }

  if (error || !model) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center flex flex-col items-center gap-3">
        <img src="/Forkling_logo.png" alt="Forky" style={{ width: 80, height: 80 }} className="object-contain" />
        <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300">Model Not Found</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Forky couldn't find anything here — this model may have moved.</p>
        <Link to="/models" className="text-accent-models hover:underline text-sm font-semibold mt-1">← Back to LLM Explorer</Link>
      </div>
    );
  }

  const pipelineInfo = PIPELINE_TAGS[model.pipeline_tag] || { label: model.pipeline_tag || 'Unknown', icon: '🤖' };
  const licenseValue = model.cardData?.license || model.license || null;
  const licenseClass = classifyLicense(licenseValue);
  const author = decodedId.split('/')[0] || '';
  const name = decodedId.split('/').slice(1).join('/') || decodedId;
  const tags = model.tags || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Back */}
      <Link to="/models" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-accent-models transition-colors mb-6">
        <FiArrowLeft className="text-sm" />
        Back to LLM Explorer
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-950/30 flex items-center justify-center text-2xl">
            {pipelineInfo.icon}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-headline text-gray-900 dark:text-gray-100">
              {name}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
              by {author}
              <a
                href={`https://huggingface.co/${decodedId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-models hover:underline flex items-center gap-1"
              >
                <FiExternalLink className="text-xs" /> View on HF
              </a>
            </p>
          </div>
        </div>

        {/* Pipeline & License badges */}
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-violet-50 dark:bg-violet-950/20 text-accent-models px-3 py-1 rounded-full border border-violet-200 dark:border-violet-800/40">
            <HiOutlineSparkles className="text-sm" />
            {pipelineInfo.label}
          </span>
          {licenseValue && (
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              licenseClass === 'permissive' ? 'badge-healthy' :
              licenseClass === 'restrictive' ? 'badge-warn' :
              'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
            }`}>
              {licenseValue} · {licenseClass === 'permissive' ? 'Permissive' : licenseClass === 'restrictive' ? 'Restrictive' : 'Other'}
            </span>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200/50 dark:border-violet-800/40 rounded-2xl p-5 text-center">
          <FiDownload className="text-accent-models text-xl mx-auto mb-2" />
          <div className="text-xl font-extrabold text-accent-models font-headline">{formatNumber(model.downloads)}</div>
          <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">Downloads</p>
        </div>
        <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200/50 dark:border-violet-800/40 rounded-2xl p-5 text-center">
          <FiHeart className="text-pink-500 text-xl mx-auto mb-2" />
          <div className="text-xl font-extrabold text-accent-models font-headline">{formatNumber(model.likes)}</div>
          <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">Likes</p>
        </div>
        <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200/50 dark:border-violet-800/40 rounded-2xl p-5 text-center">
          <FiClock className="text-accent-models text-xl mx-auto mb-2" />
          <div className="text-sm font-bold text-gray-700 dark:text-gray-300">{formatDate(model.lastModified || model.updatedAt)}</div>
          <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">Last Modified</p>
        </div>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="bg-white dark:bg-[#161A22] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-6">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <FiTag className="text-accent-models" />
            Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 20).map(tag => (
              <span key={tag} className="text-xs font-medium bg-violet-50 dark:bg-violet-950/10 text-accent-models/80 px-2.5 py-1 rounded-full border border-violet-200/50 dark:border-violet-800/30">
                {tag}
              </span>
            ))}
            {tags.length > 20 && (
              <span className="text-xs text-gray-400">+{tags.length - 20} more</span>
            )}
          </div>
        </div>
      )}

      {/* Model Card Info */}
      {model.cardData && (
        <div className="bg-white dark:bg-[#161A22] border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">Model Information</h3>
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            {model.cardData.language && (
              <div className="flex items-start gap-3">
                <span className="font-semibold text-gray-700 dark:text-gray-300 w-32 flex-shrink-0">Languages</span>
                <span>{Array.isArray(model.cardData.language) ? model.cardData.language.join(', ') : model.cardData.language}</span>
              </div>
            )}
            {model.cardData.datasets && (
              <div className="flex items-start gap-3">
                <span className="font-semibold text-gray-700 dark:text-gray-300 w-32 flex-shrink-0">Datasets</span>
                <span>{Array.isArray(model.cardData.datasets) ? model.cardData.datasets.join(', ') : model.cardData.datasets}</span>
              </div>
            )}
            {model.cardData.base_model && (
              <div className="flex items-start gap-3">
                <span className="font-semibold text-gray-700 dark:text-gray-300 w-32 flex-shrink-0">Base Model</span>
                <span>{model.cardData.base_model}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* N/A fallback */}
      {!model.cardData && (
        <div className="bg-white dark:bg-[#161A22] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Detailed model card information is not available for this model. Visit Hugging Face for the full model card.
          </p>
        </div>
      )}
    </div>
  );
}
