import { callModel } from "@/lib/llm/model";
import { createClient } from "@supabase/supabase-js";

// Knowledge Graph Extractor and Relationship Inference

export async function extractConcepts(documentId: string, content: string, userId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log(`[Knowledge] Extracting concepts for document ${documentId}...`);

  // 1. Ask LLM to extract concepts
  const prompt = `
Extract all key concepts, terms, and entities from this text. 
For each concept, provide: name, definition (if present), type (term/person/process/theory/formula), and related concepts mentioned in the same context.
Respond with a JSON object in this exact format:
{
  "concepts": [
    {
      "name": "Concept Name",
      "type": "concept_type",
      "definition": "Definition or description",
      "related": ["Related Concept 1", "Related Concept 2"],
      "confidence": 0.9
    }
  ]
}

Text:
${content.substring(0, 4000)} // truncate for token limits if necessary
`;

  try {
    const rawOutput = await callModel(prompt, "gpt-4o-mini");
    const jsonStart = rawOutput.indexOf("{");
    const jsonEnd = rawOutput.lastIndexOf("}");
    const jsonStr = rawOutput.substring(jsonStart, jsonEnd + 1);
    const parsed = JSON.parse(jsonStr);

    if (!parsed.concepts || !Array.isArray(parsed.concepts)) return;

    // 2. Insert Concepts and Links
    for (const concept of parsed.concepts) {
      const normalizedName = concept.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Upsert concept
      const { data: insertedConcept, error: conceptError } = await supabase.from("concepts").upsert({
        name: concept.name,
        normalized_name: normalizedName,
        type: concept.type,
        definition: concept.definition,
        owner_id: userId,
        first_seen_document_id: documentId,
        confidence: concept.confidence || 0.8
      }, { onConflict: 'normalized_name,owner_id' }).select().single();

      if (conceptError || !insertedConcept) continue;

      // Link to document
      await supabase.from("document_concepts").upsert({
        document_id: documentId,
        concept_id: insertedConcept.id,
        relevance_score: 0.8,
        mention_count: 1
      }, { onConflict: 'document_id,concept_id' });

      // Build initial relationships
      if (concept.related && Array.isArray(concept.related)) {
        for (const relatedName of concept.related) {
           const normRelated = relatedName.toLowerCase().replace(/[^a-z0-9]/g, '');
           
           // Ensure related concept exists
           const { data: relatedConcept } = await supabase.from("concepts").upsert({
             name: relatedName,
             normalized_name: normRelated,
             owner_id: userId,
           }, { onConflict: 'normalized_name,owner_id' }).select().single();

           if (relatedConcept) {
             await supabase.from("concept_relationships").upsert({
               source_concept_id: insertedConcept.id,
               target_concept_id: relatedConcept.id,
               relationship_type: "relates_to",
               strength: 0.5,
               first_seen_document_id: documentId,
               last_seen_document_id: documentId
             }, { onConflict: 'source_concept_id,target_concept_id,relationship_type' });
           }
        }
      }
    }
    
    console.log(`[Knowledge] Successfully extracted and stored concepts for ${documentId}`);

  } catch (err) {
    console.error("[Knowledge] Extraction failed:", err);
  }
}
