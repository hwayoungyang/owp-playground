import { useOwpTranslation } from '@owp/components/hooks';
import { useId } from 'react';
import { CodeSnippet } from '../code/CodeSnippet';

const sharedMcpUrlPlaceholder = '<OWP_MCP_URL>/mcp';

export function McpGettingStarted({
  packageName,
  version,
  headingId,
}: {
  readonly packageName: string;
  readonly version: string;
  readonly headingId?: string;
}) {
  const { t } = useOwpTranslation();
  const generatedHeadingId = useId();
  const sectionHeadingId = headingId ?? generatedHeadingId;
  const requestExample = t(
    '{{packageName}} {{version}} 기준으로 MCP에서 공개 API·가이드·사용 예제를 찾아 구현해 주세요. 응답의 packageVersion을 확인하고, 후속 조회에는 그 값을 version으로 지정하고 같은 releaseId를 사용해 주세요.',
    { packageName, version },
  );

  return (
    <section aria-labelledby={sectionHeadingId}>
      <h2 id={sectionHeadingId}>{t('MCP 서버 연결')}</h2>
      <p>
        {t(
          'MCP는 지원이 완료된 패키지의 공개 API·가이드·실행 예제를 제공합니다. AI가 설치 버전에 맞는 설정과 사용 방법을 같은 스냅샷에서 확인할 수 있습니다.',
        )}
      </p>
      <p>
        {t(
          '사용하는 앱의 MCP 설정에 아래 서버 정보를 등록합니다. 설정 위치와 형식은 앱마다 다릅니다.',
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
      <p>
        {t(
          '연결 정보를 등록한 뒤 아래 예시로 요청합니다. 예시는 Playground에 설치된 정확한 패키지 버전을 사용하므로, 프로젝트의 설치 버전이 다르면 해당 버전으로 바꾸어 요청하세요.',
        )}
      </p>
      <CodeSnippet label={t('프롬프트 예시')} code={requestExample} />
      <p className="guide-note">
        {t(
          '응답의 packageVersion이 요청한 버전과 일치하는지 확인하세요. 후속 조회에서도 같은 version과 releaseId를 사용하면 서로 다른 배포 버전의 자료가 섞이지 않습니다.',
        )}
      </p>
    </section>
  );
}
