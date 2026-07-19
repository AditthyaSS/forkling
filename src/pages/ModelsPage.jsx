import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { searchModels, PIPELINE_TAGS, classifyLicense } from '@/api/huggingface';
import ModelIcon from '@/components/ModelIcon';
import { FiSearch, FiDownload, FiHeart, FiLoader } from 'react-icons/fi';
import {
  TbBrain,
  TbMessageCircle,
  TbPhoto,
  TbMicrophone,
  TbTag,
  TbCpu,
  TbWorld,
} from 'react-icons/tb';
import { HiOutlineSparkles } from 'react-icons/hi2';
import { formatNumber } from '@/utils/format';

/** Category pills use react-icons consistently — no emoji */
const CATEGORY_PILLS = [
  { key: '',                           label: 'All Models',      Icon: TbBrain       },
  { key: 'text-generation',            label: 'Text Generation', Icon: TbMessageCircle },
  { key: 'text-to-image',              label: 'Text to Image',   Icon: TbPhoto       },
  { key: 'automatic-speech-recognition', label: 'Speech',        Icon: TbMicrophone  },
  { key: 'text-classification',        label: 'Classification',  Icon: TbTag         },
  { key: 'feature-extraction',         label: 'Embeddings',      Icon: TbCpu         },
];

function ModelCardSkeleton() {
  return (
    <div className="bg-white dark:bg-[#161A22] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg skeleton flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-4 w-2/3 skeleton" />
          <div className="h-3 w-1/3 skeleton" />
        </div>
      </div>
      <div className="h-4 w-24 skeleton rounded-full mb-3" />
      <div className="h-px bg-gray-100 dark:bg-gray-800 mb-3" />
      <div className="flex gap-4">
        <div className="h-3 w-16 skeleton" />
        <div className="h-3 w-12 skeleton" />
      </div>
    </div>
  );
}

export default function ModelsPage() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await searchModels({
          search,
          pipeline_tag: category,
          sort: 'downloads',
          limit: 30,
          skip: page * 30,
        });
        const items = Array.isArray(data) ? data : [];
        setModels(prev => page === 0 ? items : [...prev, ...items]);
      } catch {
        if (page === 0) setModels([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [search, category, page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    setModels([]);
  };

  const handleCategoryChange = (key) => {
    setCategory(key);
    setPage(0);
    setModels([]);
  };

  const totalModels = models.length;
  const totalDownloads = models.reduce((sum, m) => sum + (m.downloads || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-50 dark:bg-violet-950/20 border border-violet-200/60 dark:border-violet-800/40 text-accent-models text-xs font-bold uppercase tracking-[0.15em] mb-6">
          <HiOutlineSparkles className="text-sm" />
          LLM Explorer
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-headline text-gray-900 dark:text-gray-100 mb-3 tracking-tight">
          Open-Source <span className="models-gradient-text">LLMs</span> for Your Project
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base max-w-2xl mx-auto">
          Explore open-source language models on Hugging Face. Filter by task, compare downloads, and find the right model.
        </p>
      </div>

      {/* Stat Strip */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200/50 dark:border-violet-800/40 rounded-2xl p-4 text-center">
          <div className="text-2xl font-extrabold text-accent-models font-headline">
            {totalModels > 0 ? `${totalModels}+` : '—'}
          </div>
          <p className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">Models Loaded</p>
        </div>
        <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200/50 dark:border-violet-800/40 rounded-2xl p-4 text-center">
          <div className="text-2xl font-extrabold text-accent-models font-headline">{CATEGORY_PILLS.length - 1}</div>
          <p className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">Categories</p>
        </div>
        <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200/50 dark:border-violet-800/40 rounded-2xl p-4 text-center">
          <div className="text-2xl font-extrabold text-accent-models font-headline">
            {totalDownloads > 0 ? formatNumber(totalDownloads) : '—'}
          </div>
          <p className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">Total Downloads</p>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-6">
        <div className="flex items-center bg-white dark:bg-[#161A22] border-2 border-gray-200 dark:border-gray-700 rounded-xl focus-within:border-accent-models transition-colors">
          <FiSearch className="ml-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); setModels([]); }}
            placeholder="Search models by name or author…"
            className="flex-1 px-3 py-3 text-sm bg-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none"
          />
        </div>
      </form>

      {/* Category Pills — react-icons only, no emoji */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {CATEGORY_PILLS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => handleCategoryChange(key)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-200 ${
              category === key
                ? 'bg-accent-models border-accent-models text-white'
                : 'bg-white dark:bg-[#161A22] border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-accent-models hover:text-accent-models dark:hover:text-violet-400'
            }`}
          >
            <Icon className="text-base flex-shrink-0" />
            {label}
          </button>
        ))}
      </div>

      {/* Model Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && models.length === 0
          ? Array.from({ length: 6 }).map((_, i) => <ModelCardSkeleton key={i} />)
          : models.map(model => {
              const modelId = model.id || model.modelId || '';
              const licenseClass = classifyLicense(model.license || model.cardData?.license);
              const pipelineInfo = PIPELINE_TAGS[model.pipeline_tag] || { label: model.pipeline_tag || 'Unknown', iconKey: 'brain' };
              const authorName = modelId.split('/')[0] || '';
              const repoName   = modelId.split('/').slice(1).join('/') || modelId;

              return (
                <Link
                  key={modelId}
                  to={`/models/${encodeURIComponent(modelId)}`}
                  className="group bg-white dark:bg-[#161A22] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 card-hover-models flex flex-col"
                >
                  {/* Header row: icon + name */}
                  <div className="flex items-start gap-3 mb-3">
                    {/* Org avatar → icon badge fallback */}
                    <ModelIcon modelId={modelId} iconKey={pipelineInfo.iconKey} size="sm" />

                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-accent-models transition-colors">
                        {repoName || authorName}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{authorName}</p>
                    </div>
                  </div>

                  {/* Pipeline badge */}
                  <span className="text-[10px] font-bold bg-violet-50 dark:bg-violet-950/20 text-accent-models px-2.5 py-0.5 rounded-full self-start mb-3 border border-violet-200 dark:border-violet-800/40 whitespace-nowrap">
                    {pipelineInfo.label}
                  </span>

                  {/* Stats row */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-auto pt-3 border-t border-gray-100 dark:border-gray-800">
                    <span className="flex items-center gap-1">
                      <FiDownload className="text-accent-models" />
                      {formatNumber(model.downloads)}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiHeart className="text-pink-500" />
                      {formatNumber(model.likes)}
                    </span>
                    {(model.license || model.cardData?.license) && (
                      <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        licenseClass === 'permissive' ? 'badge-healthy' :
                        licenseClass === 'restrictive' ? 'badge-warn' :
                        'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                      }`}>
                        {model.license || model.cardData?.license}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })
        }
      </div>

      {/* Empty state */}
      {!loading && models.length === 0 && (
        <div className="text-center py-16 flex flex-col items-center gap-3">
          <img src="/Forkling_logo.png" alt="Forky" style={{ width: 80, height: 80 }} className="object-contain" />
          <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">No models found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Forky couldn't find anything here — try a different search.</p>
        </div>
      )}

      {/* Load more */}
      {models.length > 0 && models.length % 30 === 0 && (
        <div className="text-center mt-8">
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-8 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-700 dark:text-gray-300 rounded-xl hover:border-accent-models hover:text-accent-models transition-all disabled:opacity-50"
          >
            {loading ? <FiLoader className="animate-spin" /> : null}
            Load More Models
          </button>
        </div>
      )}
    </div>
  );
}
