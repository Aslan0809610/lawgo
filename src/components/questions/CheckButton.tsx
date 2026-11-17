export function CheckButton({
  ready,
  submitted,
  submit,
}: {
  ready: boolean;
  submitted: boolean;
  submit(): void;
}) {
  return (
    <button className="primary check" disabled={!ready || submitted} onClick={submit}>
      檢查
    </button>
  );
}
