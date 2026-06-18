-- Add AI-detected doc type and aggregated confidence to customer_documents
ALTER TABLE customer_documents ADD COLUMN ai_doc_type VARCHAR(50);
ALTER TABLE customer_documents ADD COLUMN confidence DECIMAL(5,4);
