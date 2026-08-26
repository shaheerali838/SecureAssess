# 3.0 Database & Mongoose Conventions

## Global Schema Rules

1. **Automatic Timestamps**:
   Every Mongoose schema must enable automatic timestamp management:
   ```javascript
   const schema = new mongoose.Schema(
     {
       // fields...
     },
     {
       timestamps: true, // Automatically manages createdAt and updatedAt
     }
   );
   ```

2. **MongoDB ObjectId References**:
   All relational links between domain entities use native MongoDB `mongoose.Schema.Types.ObjectId` with explicit `ref` declarations:
   ```
   Organization
        │
        ├── User.organizationId
        ├── Candidate.organizationId
        ├── Question.organizationId
        ├── Assessment.organizationId
        ├── Attempt.organizationId
        └── Result.organizationId
   ```
   
   Example schema declaration:
   ```javascript
   organizationId: {
     type: mongoose.Schema.Types.ObjectId,
     ref: "Organization",
     required: [true, "Resource must belong to an organization"],
     index: true,
   }
   ```

3. **Query-Driven Indexing Strategy**:
   - Indexes must be defined strictly based on real query and filtering patterns, avoiding arbitrary indexing.
   - **Tenant Scope Index**: Single-field index on `organizationId: 1`.
   - **Compound Query Indexes**: Designed for common tenant filtering/sorting:
     - `{ organizationId: 1, status: 1 }` (Filtering assessments/attempts by status within tenant)
     - `{ organizationId: 1, createdAt: -1 }` (Paginated lists within tenant)
   - **Unique Identifiers**:
     - `email: 1` (Unique constraint for authentication)
     - `slug: 1` (Unique constraint for organization identification)
     - `accessCode: 1` (Sparse/unique for room & assessment entry)

4. **Trimming & Sanitization**:
   - String fields (names, emails, codes) must specify `trim: true`.
   - Email addresses and slugs must specify `lowercase: true`.
