<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Application architecture
- Keep the TanStack route structure and Cloud-generated integrations; uploaded source must not replace managed tooling or credentials.
- Each independently registered dentist owns a clinic; scope all clinical records and relationships to that clinic using database policies and composite foreign keys.
- Public appointment booking must use database-generated availability and an atomic reservation function, so stale slots and concurrent submissions cannot double-book.
- Share links are capability links with minimal patient data; never expose clinical notes, prescriptions, or other patients through them.
