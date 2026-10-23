"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import { ArrowRight, BookOpen, Bookmark, Code2, Folder, Menu, Plus, Search, X } from "lucide-react";

type SavedLink = {
  id?: string;
  title: string;
  url: string;
  href: string;
  collection: string;
  tags: string[];
  note?: string;
  icon: "book" | "code" | "folder";
};

const defaultCollections = ["Java Interview Prep", "DSA Practice", "College Projects"];
const ALL_COLLECTIONS = "All saved";
const LINKS_STORAGE_KEY = "tabtamer-saved-links-v1";
const COLLECTIONS_STORAGE_KEY = "tabtamer-user-collections-v1";
const savedLinks: SavedLink[] = [
  { id: "sample-jcip", title: "Java Concurrency in Practice: notes", url: "jcip.net", href: "https://jcip.net/", collection: "Java Interview Prep", tags: ["concurrency", "reading"], note: "Revisit the thread safety chapter before mock interviews.", icon: "book" },
  { id: "sample-java-collections", title: "Java collections framework", url: "dev.java/learn/api/collections-framework", href: "https://dev.java/learn/api/collections-framework/", collection: "Java Interview Prep", tags: ["collections", "reference"], icon: "code" },
  { id: "sample-neetcode", title: "NeetCode 150: practice list", url: "neetcode.io/practice", href: "https://neetcode.io/practice", collection: "DSA Practice", tags: ["roadmap", "arrays"], note: "Work through one pattern at a time.", icon: "code" },
  { id: "sample-visualgo", title: "Visualizing Data Structures and Algorithms", url: "visualgo.net", href: "https://visualgo.net/en", collection: "DSA Practice", tags: ["visual", "graphs"], icon: "book" },
  { id: "sample-nextjs", title: "Next.js App Router documentation", url: "nextjs.org/docs/app", href: "https://nextjs.org/docs/app", collection: "College Projects", tags: ["docs", "frontend"], note: "Good reference for the capstone dashboard.", icon: "folder" },
  { id: "sample-ddia", title: "Designing Data-Intensive Applications", url: "dataintensive.net", href: "https://dataintensive.net/", collection: "College Projects", tags: ["systems", "reading"], icon: "book" },
];
const sampleLinkIds = new Set(savedLinks.map((link) => link.id));

function isSavedLink(value: unknown, collectionNames: string[]): value is SavedLink {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<SavedLink>;
  let linkUrl: URL;
  try {
    linkUrl = new URL(item.href ?? "");
  } catch {
    return false;
  }
  return ["http:", "https:"].includes(linkUrl.protocol)
    && typeof item.title === "string"
    && typeof item.url === "string"
    && typeof item.href === "string"
    && typeof item.collection === "string"
    && collectionNames.includes(item.collection)
    && Array.isArray(item.tags)
    && item.tags.every((tag) => typeof tag === "string")
    && ["book", "code", "folder"].includes(item.icon ?? "");
}

function IconForLink({ kind }: { kind: SavedLink["icon"] }) {
  const Icon = kind === "book" ? BookOpen : kind === "code" ? Code2 : Folder;
  return <span className="favicon"><Icon size={15} strokeWidth={1.8} aria-hidden="true" /></span>;
}

function ProductDemo({
  compact = false,
  customLinks,
  collectionNames,
  customCollectionNames,
  deletedSampleIds,
  appError,
  onAddLink,
  onCreateCollection,
  onDeleteLink,
  onDeleteCollection,
}: {
  compact?: boolean;
  customLinks: SavedLink[];
  collectionNames: string[];
  customCollectionNames: string[];
  deletedSampleIds: string[];
  appError: string;
  onAddLink: (link: SavedLink, id?: string) => Promise<string>;
  onCreateCollection: (name: string) => Promise<string>;
  onDeleteLink: (id: string) => Promise<string>;
  onDeleteCollection: (name: string) => Promise<string>;
}) {
  const [collection, setCollection] = useState(ALL_COLLECTIONS);
  const [query, setQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isCollectionOpen, setIsCollectionOpen] = useState(false);
  const [newCollectionInput, setNewCollectionInput] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [editingId, setEditingId] = useState<string | undefined>();
  const [targetCollection, setTargetCollection] = useState(defaultCollections[0]);
  const [feedback, setFeedback] = useState("");
  const [collectionFeedback, setCollectionFeedback] = useState("");
  const allLinks = useMemo(() => [...savedLinks.filter((link) => !deletedSampleIds.includes(link.id!)), ...customLinks], [customLinks, deletedSampleIds]);
  const filtered = useMemo(() => allLinks.filter((item) => {
    const matchesCollection = collection === ALL_COLLECTIONS || item.collection === collection;
    const searchText = `${item.title} ${item.url} ${item.tags.join(" ")} ${item.note ?? ""}`.toLowerCase();
    return matchesCollection && searchText.includes(query.toLowerCase());
  }), [allLinks, collection, query]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const enteredUrl = urlInput.trim();
    const normalizedUrl = /^https?:\/\//i.test(enteredUrl) ? enteredUrl : `https://${enteredUrl}`;
    let parsedUrl: URL;

    try {
      parsedUrl = new URL(normalizedUrl);
    } catch {
      setFeedback("Paste a complete website address, like docs.example.com/page.");
      return;
    }

    if (!(["http:", "https:"].includes(parsedUrl.protocol))) {
      setFeedback("Use a website link that starts with http or https.");
      return;
    }

    const displayUrl = `${parsedUrl.host}${parsedUrl.pathname === "/" ? "" : parsedUrl.pathname}${parsedUrl.search}`;
    const tags = tagsInput.split(",").map((tag) => tag.trim()).filter(Boolean);
    const item: SavedLink = {
      title: titleInput.trim() || displayUrl || parsedUrl.host,
      url: displayUrl || parsedUrl.host,
      href: parsedUrl.href,
      collection: targetCollection,
      tags: [...new Set(tags)],
      note: noteInput.trim() || undefined,
      icon: "folder",
    };
    const result = await onAddLink(item, editingId);
    setFeedback(result);
    if (result.startsWith("Saved") || result.startsWith("Updated")) {
      setUrlInput("");
      setTitleInput("");
      setTagsInput("");
      setNoteInput("");
      setEditingId(undefined);
      setCollection(targetCollection);
    }
  }

  async function handleCreateCollection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newCollectionInput.trim();
    if (!name) {
      setCollectionFeedback("Add a name for your collection.");
      return;
    }
    const result = await onCreateCollection(name);
    setCollectionFeedback(result);
    if (result.startsWith("Created")) {
      setCollection(name);
      setTargetCollection(name);
      setNewCollectionInput("");
      setIsCollectionOpen(false);
    }
  }

  function editLink(link: SavedLink) {
    setEditingId(link.id);
    setTitleInput(link.title);
    setUrlInput(link.href);
    setTagsInput(link.tags.join(", "));
    setNoteInput(link.note ?? "");
    setTargetCollection(link.collection);
    setIsAddOpen(true);
    setFeedback("");
  }

  async function removeLink(link: SavedLink) {
    if (!link.id || !window.confirm(`Remove “${link.title}” from your library?`)) return;
    setFeedback(await onDeleteLink(link.id));
  }

  async function removeCollection(name: string) {
    const result = await onDeleteCollection(name);
    setCollectionFeedback(result);
    if (result.startsWith("Deleted")) {
      if (collection === name) setCollection(ALL_COLLECTIONS);
      if (targetCollection === name) setTargetCollection(defaultCollections[0]);
    }
  }

  return (
    <div className={`product-demo${compact ? " compact-demo" : ""}`} data-ui>
      <aside className="demo-sidebar" aria-label="Collections">
        <div className="demo-brand"><span className="mark"><Bookmark size={14} strokeWidth={2.5} /></span><span>Library</span></div>
        <p className="sidebar-title">Your collections</p>
        <div className="collection-list">
          {[ALL_COLLECTIONS, ...collectionNames].map((name) => {
            const count = name === ALL_COLLECTIONS ? allLinks.length : allLinks.filter((item) => item.collection === name).length;
            return <div className="collection-row" key={name}>
              <button type="button" className="collection-button" aria-pressed={collection === name} onClick={() => setCollection(name)}>
                <span>{name}</span><span className="collection-count">{count}</span>
              </button>
              {customCollectionNames.includes(name) && count === 0 && <button className="remove-collection-button" type="button" aria-label={`Delete ${name}`} title="Delete empty collection" onClick={() => void removeCollection(name)}><X size={13} aria-hidden="true" /></button>}
            </div>;
          })}
          <button className="create-collection-toggle" type="button" aria-expanded={isCollectionOpen} onClick={() => { setIsCollectionOpen((open) => !open); setCollectionFeedback(""); }}><Plus size={14} aria-hidden="true" /> New collection</button>
        </div>
        {isCollectionOpen && <form className="collection-form" onSubmit={handleCreateCollection}>
          <label className="visually-hidden" htmlFor={`${compact ? "compact" : "hero"}-new-collection`}>Collection name</label>
          <input id={`${compact ? "compact" : "hero"}-new-collection`} type="text" placeholder="e.g. Biology notes" value={newCollectionInput} onChange={(event) => setNewCollectionInput(event.target.value)} required maxLength={40} />
          <button type="submit">Create</button>
          {collectionFeedback && <p className="form-feedback" role="status">{collectionFeedback}</p>}
        </form>}
      </aside>
      <div className="demo-main">
        <div className="demo-topline"><h2>{collection}</h2><div className="demo-actions"><span>{filtered.length} links</span><button className="add-link-toggle" type="button" aria-expanded={isAddOpen} onClick={() => { setIsAddOpen((open) => !open); setTargetCollection(collection === ALL_COLLECTIONS ? collectionNames[0] : collection); setFeedback(""); }}><Plus size={15} aria-hidden="true" /> Add a link</button></div></div>
        {appError && <p className="form-feedback" role="alert">{appError}</p>}
        {isAddOpen && <form className="add-link-form" onSubmit={handleSubmit}>
          <div className="add-link-fields">
            <label className="visually-hidden" htmlFor={`${compact ? "compact" : "hero"}-link-title`}>Link title</label>
            <input id={`${compact ? "compact" : "hero"}-link-title`} type="text" placeholder="Name this link (optional)" value={titleInput} onChange={(event) => setTitleInput(event.target.value)} />
            <label className="visually-hidden" htmlFor={`${compact ? "compact" : "hero"}-link-url`}>Paste a website link</label>
            <input id={`${compact ? "compact" : "hero"}-link-url`} type="text" inputMode="url" autoComplete="url" placeholder="Paste a website link…" value={urlInput} onChange={(event) => setUrlInput(event.target.value)} required />
            <label className="visually-hidden" htmlFor={compact ? "compact-link-collection" : "hero-link-collection"}>Save to collection</label>
            <select id={compact ? "compact-link-collection" : "hero-link-collection"} value={targetCollection} onChange={(event) => setTargetCollection(event.target.value)}>
              {collectionNames.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
            <button className="save-link-button" type="submit">{editingId ? "Update link" : "Save link"}</button>
          </div>
          <label className="visually-hidden" htmlFor={`${compact ? "compact" : "hero"}-link-tags`}>Tags, separated by commas (optional)</label>
          <input className="tags-input" id={`${compact ? "compact" : "hero"}-link-tags`} type="text" placeholder="Tags, separated by commas (optional)" value={tagsInput} onChange={(event) => setTagsInput(event.target.value)} />
          <label className="visually-hidden" htmlFor={compact ? "compact-link-note" : "hero-link-note"}>Add a note (optional)</label>
          <input className="note-input" id={compact ? "compact-link-note" : "hero-link-note"} type="text" placeholder="Add a note while it’s fresh (optional)" value={noteInput} onChange={(event) => setNoteInput(event.target.value)} />
          {feedback && <p className="form-feedback" role="status">{feedback}</p>}
        </form>}
        <label className="search-box"><Search size={15} aria-hidden="true" /><input aria-label="Search saved links" placeholder="Search titles, notes, or tags…" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <div className="link-list" aria-live="polite">
          {filtered.map((item) => <article key={item.href} className="saved-link">
            <IconForLink kind={item.icon} />
            <div><h3 className="link-title"><a href={item.href} target="_blank" rel="noreferrer">{item.title}</a></h3><p className="link-url">{item.url}</p>{item.note && <p className="link-note">{item.note}</p>}</div>
            <div className="tag-list">{item.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
            {item.id && <div className="saved-link-actions">{!sampleLinkIds.has(item.id) && <button type="button" onClick={() => editLink(item)}>Edit</button>}<button type="button" aria-label={`Delete ${item.title}`} onClick={() => void removeLink(item)}>Delete</button></div>}
          </article>)}
          {filtered.length === 0 && <p className="empty-state">No saved links match “{query}”. Try another title or tag.</p>}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [customLinks, setCustomLinks] = useState<SavedLink[]>([]);
  const [customCollections, setCustomCollections] = useState<string[]>([]);
  const [deletedSampleIds, setDeletedSampleIds] = useState<string[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [appError, setAppError] = useState("");
  const [revealReady, setRevealReady] = useState(false);
  const collectionNames = useMemo(() => [...defaultCollections, ...customCollections], [customCollections]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll("[data-reveal]").forEach((element) => revealObserver.observe(element));
    setRevealReady(true);
    return () => revealObserver.disconnect();
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadLibrary() {
      try {
        const response = await fetch("/api/library", { cache: "no-store" });
        const initial = await response.json() as { collections?: string[]; links?: SavedLink[]; deletedSampleIds?: string[]; error?: string };
        if (!response.ok) throw new Error(initial.error ?? "Could not load the library.");
        const knownCollections = [...defaultCollections, ...(initial.collections ?? [])];

        const legacyCollections: unknown = JSON.parse(window.localStorage.getItem(COLLECTIONS_STORAGE_KEY) ?? "[]");
        if (Array.isArray(legacyCollections)) {
          for (const candidate of legacyCollections) {
            if (typeof candidate !== "string") continue;
            const name = candidate.trim();
            if (!name || knownCollections.some((existing) => existing.toLowerCase() === name.toLowerCase())) continue;
            const created = await fetch("/api/collections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
            if (created.ok) knownCollections.push(name);
            else if (created.status !== 409) throw new Error("Could not move an existing collection into the library.");
          }
        }

        const legacyLinks: unknown = JSON.parse(window.localStorage.getItem(LINKS_STORAGE_KEY) ?? "[]");
        if (Array.isArray(legacyLinks)) {
          for (const candidate of legacyLinks) {
            if (!isSavedLink(candidate, knownCollections)) continue;
            const normalizedHref = candidate.href.replace(/\/$/, "");
            const isExample = savedLinks.some((link) => link.href.replace(/\/$/, "") === normalizedHref);
            const alreadySaved = (initial.links ?? []).some((link) => link.href.replace(/\/$/, "") === normalizedHref);
            if (isExample || alreadySaved) continue;
            const migrated = await fetch("/api/links", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(candidate) });
            if (!migrated.ok && migrated.status !== 409) throw new Error("Could not move a saved link into the library.");
          }
        }

        const refreshed = await fetch("/api/library", { cache: "no-store" });
        const current = await refreshed.json() as { collections?: string[]; links?: SavedLink[]; error?: string };
        if (!refreshed.ok) throw new Error(current.error ?? "Could not load the library.");
        if (!mounted) return;
        setCustomCollections(current.collections ?? []);
        setCustomLinks(current.links ?? []);
        setDeletedSampleIds(initial.deletedSampleIds ?? []);
        setAppError("");
        window.localStorage.removeItem(COLLECTIONS_STORAGE_KEY);
        window.localStorage.removeItem(LINKS_STORAGE_KEY);
      } catch (error) {
        if (mounted) setAppError(error instanceof Error ? error.message : "The library could not connect to its backend.");
      } finally {
        if (mounted) setStorageReady(true);
      }
    }
    void loadLibrary();
    return () => { mounted = false; };
  }, []);

  async function addLink(item: SavedLink, id?: string): Promise<string> {
    if (!storageReady) return "Your library is still loading. Try again in a moment.";
    const normalizedHref = item.href.replace(/\/$/, "");
    if (!id && [...savedLinks, ...customLinks].some((saved) => saved.href.replace(/\/$/, "") === normalizedHref)) return "That link is already in your library.";
    try {
      const response = await fetch(id ? `/api/links/${encodeURIComponent(id)}` : "/api/links", {
        method: id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      const result = await response.json() as { link?: SavedLink; error?: string };
      if (!response.ok || !result.link) return result.error ?? "The link could not be saved.";
      setCustomLinks((current) => id ? current.map((link) => link.id === id ? result.link! : link) : [...current, result.link!]);
      return `${id ? "Updated" : "Saved"} in ${result.link.collection}.`;
    } catch {
      return "Could not connect to the TabTamer backend. Is the app server running?";
    }
  }

  async function addCollection(name: string): Promise<string> {
    if (!storageReady) return "Your library is still loading. Try again in a moment.";
    try {
      const response = await fetch("/api/collections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
      const result = await response.json() as { collection?: string; error?: string };
      if (!response.ok || !result.collection) return result.error ?? "The collection could not be created.";
      setCustomCollections((current) => [...current, result.collection!]);
      return `Created “${result.collection}”.`;
    } catch {
      return "Could not connect to the TabTamer backend. Is the app server running?";
    }
  }

  async function removeLink(id: string): Promise<string> {
    try {
      const response = await fetch(`/api/links/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok) {
        const result = await response.json() as { error?: string };
        return result.error ?? "The link could not be removed.";
      }
      if (sampleLinkIds.has(id)) setDeletedSampleIds((current) => current.includes(id) ? current : [...current, id]);
      setCustomLinks((current) => current.filter((link) => link.id !== id));
      return "Deleted saved link.";
    } catch {
      return "Could not connect to the TabTamer backend.";
    }
  }

  async function removeCollection(name: string): Promise<string> {
    try {
      const response = await fetch(`/api/collections/${encodeURIComponent(name)}`, { method: "DELETE" });
      if (!response.ok) {
        const result = await response.json() as { error?: string };
        return result.error ?? "The collection could not be removed.";
      }
      setCustomCollections((current) => current.filter((collection) => collection !== name));
      return `Deleted “${name}”.`;
    } catch {
      return "Could not connect to the TabTamer backend.";
    }
  }
  const closeMenu = () => setMenuOpen(false);
  return (
    <>
      <header id="top" className="topbar page-frame">
        <a className="wordmark" href="#top" aria-label="TabTamer home"><span className="mark"><Bookmark size={17} strokeWidth={2.4} /></span>TabTamer</a>
        <nav className="nav-links" aria-label="Main navigation">
          <a href="#features">Features</a><a href="#how-it-works">How it works</a><a className="nav-cta" href="#try-it">Try the demo</a>
        </nav>
        <button className="mobile-toggle" type="button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X size={23} /> : <Menu size={23} />}</button>
        {menuOpen && <nav className="mobile-menu" aria-label="Mobile navigation"><a href="#features" onClick={closeMenu}>Features</a><a href="#how-it-works" onClick={closeMenu}>How it works</a><a href="#try-it" onClick={closeMenu}>Try the demo</a></nav>}
      </header>

      <main className={revealReady ? "reveal-ready" : undefined}>
        <section className="hero-band" aria-labelledby="hero-title">
          <div className="hero-backdrop" aria-hidden="true"><Image src="https://images.pexels.com/photos/3807755/pexels-photo-3807755.jpeg?auto=compress&cs=tinysrgb&w=2000" alt="" fill unoptimized priority sizes="100vw" /></div>
          <div className="hero page-frame">
          <div className="hero-copy">
            <h1 id="hero-title" className="hero-title" data-reveal><span className="hero-word hero-word-block">SAVE IT.</span><span className="hero-word hero-word-plain">FIND IT.</span></h1>
            <div className="hero-intro" data-reveal><p>A home for the links behind your classes, projects, and ideas. Paste a URL, give it a collection, and find it when you need it.</p><div className="hero-actions"><a className="button-primary" href="#live-library">Try adding a link <ArrowRight size={15} style={{ display: "inline", verticalAlign: "-2px", marginLeft: 5 }} /></a><a className="text-link" href="#how-it-works">How it works</a></div></div>
          </div>
          <div className="hero-showcase">
            <div data-reveal><ProductDemo customLinks={customLinks} collectionNames={collectionNames} customCollectionNames={customCollections} deletedSampleIds={deletedSampleIds} appError={appError} onAddLink={addLink} onCreateCollection={addCollection} onDeleteLink={removeLink} onDeleteCollection={removeCollection} /></div>
          </div>
          </div>
          <a className="hero-photo-credit" href="https://www.pexels.com/photo/woman-in-yellow-shirt-writing-on-white-paper-3807755/" target="_blank" rel="noreferrer">Photo by Andrea Piacquadio / Pexels</a>
        </section>

        <section className="section page-frame" aria-labelledby="problem-title">
          <div className="problem">
            <div className="section-heading" data-reveal><h2 id="problem-title">Good links get lost.</h2><p>Browser bookmarks collect faster than they become useful.</p></div>
            <div className="problem-copy" data-reveal><p>A course resource lives beside a half-read article, a project reference, and twenty tabs you meant to come back to. Later, browser history remembers when you visited, but not why you saved it.</p><div className="solution-note"><p>Put each link in a collection, add the context while it’s fresh, and search it when you need it.</p></div><figure className="section-photo problem-photo"><Image src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=85" alt="Students sharing ideas around a laptop" fill unoptimized sizes="(max-width: 760px) 100vw, 55vw" /></figure></div>
          </div>
        </section>

        <section className="section features-section" id="features" aria-labelledby="features-title">
          <div className="page-frame feature-layout">
            <div><div className="section-heading" data-reveal><h2 id="features-title">A useful place for every link.</h2><p>Small details that make a growing library easier to return to.</p></div>
              <div className="feature-list">
                <article className="feature-item" data-reveal><h3>Collections</h3><p>Group links by course, project, or the question you’re working through.</p></article>
                <article className="feature-item" data-reveal><h3>Saved links</h3><p>Keep the original page address alongside a clear title.</p></article>
                <article className="feature-item" data-reveal><h3>Search</h3><p>Find a saved page by its title, URL, note, or tag.</p></article>
                <article className="feature-item" data-reveal><h3>Notes &amp; tags</h3><p>Remember why it mattered and label it for your own way of thinking.</p></article>
                <article className="feature-item" data-reveal><h3>Import &amp; export</h3><p>Bring in browser bookmarks and keep a copy of your library.</p></article>
                <article className="feature-item" data-reveal><h3>Session history</h3><p>Pick up links from a recent research session without retracing your steps.</p></article>
              </div>
            </div>
            <p className="feature-aside" data-reveal><strong>Organized around your work.</strong> “Java Interview Prep” can hold references and revision notes. “DSA Practice” can keep a visualizer beside a problem list. Your collections reflect the task, not the browser that opened the page.</p>
          </div>
        </section>

        <section className="section steps-section page-frame" id="how-it-works" aria-labelledby="steps-title">
          <div className="section-heading" data-reveal><h2 id="steps-title">Three small steps.</h2><p>Start with what you already have; add structure as you go.</p></div>
          <div className="steps-layout"><ol className="steps">
            <li className="step" data-reveal><h3>Create a collection</h3><p>Make one for a class, an interview topic, or a project you’re researching.</p></li>
            <li className="step" data-reveal><h3>Save a link with context</h3><p>Add the page, a quick note, and a tag that will make sense later.</p></li>
            <li className="step" data-reveal><h3>Find it when you need it</h3><p>Search across saved titles, notes, and tags, or browse a collection.</p></li>
          </ol><figure className="section-photo steps-photo" data-reveal><Image src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=85" alt="A bright desk with a laptop open to code and notes" fill unoptimized sizes="(max-width: 900px) 100vw, 30vw" /></figure></div>
        </section>

        <section className="section preview-section" id="live-library" aria-labelledby="preview-title">
          <div className="page-frame">
            <div className="section-heading" data-reveal><h2 id="preview-title">A library that speaks your language.</h2><p>Collections built around real work, with enough context to make a saved link useful later.</p></div>
            <div className="preview-row"><p className="preview-copy" data-reveal><strong>Try the controls.</strong> Create a collection, search saved titles, or add a URL with a title, note, and tags. Your library is stored by the local TabTamer server.</p><div className="preview-shell" data-reveal><ProductDemo compact customLinks={customLinks} collectionNames={collectionNames} customCollectionNames={customCollections} deletedSampleIds={deletedSampleIds} appError={appError} onAddLink={addLink} onCreateCollection={addCollection} onDeleteLink={removeLink} onDeleteCollection={removeCollection} /></div></div>
          </div>
        </section>

        <section className="cta-section page-frame" id="try-it" aria-labelledby="cta-title">
          <div className="cta-inner" data-reveal><div><h2 id="cta-title">Make room for the next good idea.</h2></div><div className="cta-actions"><p>Add a link to the sample library. Your saved items stay in this browser, ready to search next time.</p><a className="button-primary" href="#live-library">Add your first link <ArrowRight size={15} style={{ display: "inline", verticalAlign: "-2px", marginLeft: 5 }} /></a></div></div>
        </section>
      </main>

      <footer className="footer"><div className="page-frame footer-inner"><a className="wordmark" href="#top"><span className="mark"><Bookmark size={16} strokeWidth={2.4} /></span>TabTamer</a><nav className="footer-nav" aria-label="Footer navigation"><a href="#features">Features</a><a href="#how-it-works">How it works</a><a href="#try-it">Try the demo</a></nav><p className="copyright">A calmer home for the links you keep.</p></div></footer>
    </>
  );
}
