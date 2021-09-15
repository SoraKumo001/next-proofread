import { useRouter } from 'next/dist/client/router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import styled from './index.module.scss';

interface SuggestionType {
  word: string;
  suggestion: string;
  note: string;
  rule: string;
  offset: number;
  length: number;
}
type ResponseType = {
  id: string | number;
  jsonrpc: '2.0';
} & (
  | {
      Error: {
        Message: string;
      };
    }
  | {
      result: {
        suggestions: SuggestionType[];
      };
    }
);

const useProofead = () => {
  const [state, setState] = useState<'idel' | 'progress' | 'finished' | 'error'>('idel');
  const [result, setResult] = useState<[string?, SuggestionType[]?]>([]);
  const dispatch = useCallback((query) => {
    setState('progress');
    fetch(`/api/?q=${encodeURI(query)}`)
      .then((r) => r.json())
      .then((r: ResponseType) => {
        if ('result' in r) {
          setResult([
            query,
            r.result.suggestions.map((s) => ({
              ...s,
              offset: Number(s.offset),
              length: Number(s.length),
            })),
          ]);
          setState('finished');
        } else {
          setState('error');
          console.error(r.Error);
        }
      })
      .catch((e) => setState('error'));
  }, []);

  return { state, text: result[0], result: result[1], dispatch };
};

const Page = () => {
  const router = useRouter();
  const defaultQuery = router.query['query']?.[0];
  const { state, text, result, dispatch } = useProofead();
  const [selectIndex, setSelectIndex] = useState<number>();
  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    dispatch(e.currentTarget.text.value);
    e.preventDefault();
  };
  const words = useMemo(() => {
    if (result && text) {
      const words = [];
      let pointer = 0;
      result.forEach((s) => {
        words.push(text.substr(pointer, s.offset - pointer));
        words.push(text.substr(s.offset, s.length));
        pointer = s.offset + s.length;
      });
      words.push(text.substr(pointer));
      return words;
    }
    return undefined;
  }, [result, text]);
  useEffect(() => {
    if (defaultQuery) dispatch(defaultQuery);
  }, [defaultQuery, dispatch]);
  return (
    <div className={styled.root}>
      <form onSubmit={handleSubmit}>
        <div className={styled.buttonLine}>
          <button>校正</button>
          <span className={styled.state}>{state}</span>
        </div>
        <textarea key={defaultQuery} name="text" cols={80} rows={10} defaultValue={defaultQuery} />
      </form>
      {words?.length && (
        <div className={styled.srcText}>
          {words?.map((w, index) =>
            index % 2 ? (
              <ruby
                key={index}
                className={styled.target}
                onMouseEnter={() => setSelectIndex(Math.floor(index / 2))}
                onMouseLeave={() => setSelectIndex(undefined)}
              >
                {w}
                <rt>
                  <span>{Math.floor(index / 2) + 1}</span>
                </rt>
              </ruby>
            ) : (
              w
            )
          )}
        </div>
      )}
      <div>
        <div className={styled.info}>
          {result &&
            (result.length ? (
              <div>
                {result.map((r, index) => (
                  <div key={index} className={selectIndex === index ? styled.select : undefined}>
                    <span className={styled.index}>{index + 1}</span>
                    {r.rule}
                    {r.note && ` - ${r.note}`}
                  </div>
                ))}
              </div>
            ) : (
              <div>校正はありません</div>
            ))}
        </div>
      </div>
    </div>
  );
};
export default Page;
