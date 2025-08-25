
export const track = (event: string, props: Record<string, any> = {}) => {
  (window as any).plausible?.(event, { props });
};
