// app/api/search/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query || !query.trim()) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 });
    }

    const encodedQuery = encodeURIComponent(query);
    let results = [];

    // Try 1: Use DuckDuckGo's Instant Answer API (free, no key required)
    try {
      const response = await fetch(
        `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1&t=bubbly`
      );
      
      if (response.ok) {
        const data = await response.json();
        
        // Handle instant answer
        if (typeof data?.AbstractText === 'string' && data.AbstractText) {
          results.push({
            title: data.Heading || data.AbstractSource || query,
            url: data.AbstractURL || `https://duckduckgo.com/?q=${encodedQuery}`,
            snippet: data.AbstractText,
            domain: data.AbstractURL ? new URL(data.AbstractURL).hostname : "duckduckgo.com",
            source: "DuckDuckGo Instant"
          });
        }
        
        // Handle related topics
        if (Array.isArray(data?.RelatedTopics) && data.RelatedTopics.length > 0) {
          const related = data.RelatedTopics
            .filter((topic: any) => topic.Text && topic.FirstURL)
            .slice(0, 8)
            .map((topic: any) => ({
              title: topic.Text?.split('-')[0]?.trim() || "Related Topic",
              url: topic.FirstURL || "#",
              snippet: topic.Text || "",
              domain: topic.FirstURL ? new URL(topic.FirstURL).hostname : "duckduckgo.com",
              source: "DuckDuckGo Related"
            }));
          results = [...results, ...related];
        }
      }
    } catch (ddgError) {
      console.warn("DuckDuckGo API failed:", ddgError);
    }

    // Try 2: Use Wikipedia as fallback
    if (results.length === 0) {
      try {
        const wikiResponse = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedQuery}`
        );
        
        if (wikiResponse.ok) {
          const wikiData = await wikiResponse.json();
          results.push({
            title: wikiData.title || query,
            url: wikiData.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodedQuery}`,
            snippet: typeof wikiData?.extract === 'string' ? wikiData.extract : `Wikipedia article about ${query}.`,
            domain: "en.wikipedia.org",
            source: "Wikipedia"
          });
        }
      } catch (wikiError) {
        console.warn("Wikipedia API failed:", wikiError);
      }
    }

    // Try 3: Use a free search API (if available)
    if (results.length === 0) {
      try {
        // Using a free, open search API
        const searchResponse = await fetch(
          `https://api.searx.be/search?q=${encodedQuery}&format=json&categories=general`
        );
        
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (Array.isArray(searchData?.results) && searchData.results.length > 0) {
            results = searchData.results.slice(0, 8).map((result: any) => ({
              title: result.title || "Search Result",
              url: result.url || "#",
              snippet: typeof result?.content === 'string' ? result.content : (typeof result?.description === 'string' ? result.description : ""),
              domain: result.url ? new URL(result.url).hostname : "",
              source: "SearXNG"
            }));
          }
        }
      } catch (searxError) {
        console.warn("SearXNG API failed:", searxError);
      }
    }

    // Final fallback: Educational mock results
    if (results.length === 0) {
      results = [
        {
          title: `${query} - Wikipedia`,
          url: `https://en.wikipedia.org/wiki/${encodedQuery}`,
          snippet: `Information about ${query} from Wikipedia, the free encyclopedia.`,
          domain: "en.wikipedia.org",
          source: "Educational Resource"
        },
        {
          title: `${query} - Britannica`,
          url: `https://www.britannica.com/search?query=${encodedQuery}`,
          snippet: `Encyclopedia Britannica entry for ${query}.`,
          domain: "britannica.com",
          source: "Educational Resource"
        },
        {
          title: `${query} - Google Scholar`,
          url: `https://scholar.google.com/scholar?q=${encodedQuery}`,
          snippet: `Academic papers and research on ${query}.`,
          domain: "scholar.google.com",
          source: "Educational Resource"
        },
        {
          title: `${query} - PubMed`,
          url: `https://pubmed.ncbi.nlm.nih.gov/?term=${encodedQuery}`,
          snippet: `Medical and scientific literature on ${query}.`,
          domain: "pubmed.ncbi.nlm.nih.gov",
          source: "Educational Resource"
        },
        {
          title: `${query} - arXiv`,
          url: `https://arxiv.org/search/?query=${encodedQuery}&searchtype=all`,
          snippet: `Preprint papers and research on ${query}.`,
          domain: "arxiv.org",
          source: "Educational Resource"
        }
      ];
    }

    return NextResponse.json({ 
      results,
      query: query,
      count: results.length,
      sources: [...new Set(results.map((r: any) => r.source).filter(Boolean))]
    });

  } catch (error: any) {
    console.error("Search API Error:", error);
    return NextResponse.json({ 
      error: error.message || "Search failed.",
      results: []
    }, { status: 500 });
  }
}