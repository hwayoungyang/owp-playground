import { useOwpTranslation } from '@owp/components/hooks';
import { useId } from 'react';
import { CodeSnippet } from '../code/CodeSnippet';

const sharedMcpUrlPlaceholder = '<OWP_MCP_URL>/mcp';

export function McpGettingStarted({
  packageName,
  version,
}: {
  readonly packageName: string;
  readonly version: string;
}) {
  const { t } = useOwpTranslation();
  const headingId = useId();
  const requestExample = t(
    '{{packageName}} {{version}} 기준으로 MCP에서 공개 API와 사용 예제를 찾아 구현해 주세요. 첫 조회에서 받은 releaseId를 후속 조회에도 사용해 주세요.',
    { packageName, version },
  );

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId}>{t('AI 도구에 MCP 연결하기')}</h2>
      <p>
        {t(
          'AI 도구의 MCP 설정에서 서버 추가를 선택하고, 아래 세 가지 값을 입력한 뒤 저장합니다. 입력 위치와 설정 형식은 AI 도구마다 다릅니다.',
        )}
      </p>
      <p>{t('서버 이름: owp')}</p>
      <p>{t('전송 방식: Streamable HTTP')}</p>
      <CodeSnippet label={t('공용 MCP 주소')} code={sharedMcpUrlPlaceholder} />
      <p className="guide-note">
        {t(
          '<OWP_MCP_URL>에 팀 공용 서버의 기본 주소를 입력합니다. /mcp는 MCP 연결 경로입니다. 주소·인증·접근 권한은 Impix SmartBiz 팀에 확인해 주세요.',
        )}
      </p>
      <p>{t('연결 정보를 확인하고 등록한 뒤, 사용할 패키지와 버전을 지정해 AI에 요청합니다.')}</p>
      <CodeSnippet label={t('프롬프트 예시')} code={requestExample} />
      <p className="guide-note">
        {t(
          'MCP는 지원이 완료된 패키지의 자료만 제공합니다. 후속 조회에서도 같은 releaseId를 사용하면 서로 다른 배포 버전의 자료가 섞이지 않습니다.',
        )}
      </p>
    </section>
  );
}
