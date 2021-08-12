import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client'
import { RichText } from 'prismic-dom';

import format from 'date-fns/format';
import ptBR from 'date-fns/locale/pt-BR';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { useState, useEffect } from 'react';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const { isFallback } = useRouter();
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);

  function contentWordCount() {
    const wordArray = post.data.content.map(content => (
      content.body.map(body => body.text.split(" ")).reduce((bodyText, newText) => {
        bodyText.push(...newText)
        return bodyText;
      })
    ))
    const bodyWords = wordArray.reduce((totalWords, newWords) => {
      totalWords.push(...newWords);
      return totalWords;
    })

    const headingWords = post.data.content.map(content =>
      content.heading.split(" ")).reduce((headingText, newText) => {
        headingText.push(...newText)
        return headingText
      })

    setWordCount(bodyWords.length + headingWords.length)

    if (wordCount) {
      setReadingTime(Math.ceil(wordCount / 200));
    }
  }

  useEffect(() => {
    if (!isFallback) {
      contentWordCount();
    }
  }, [isFallback, wordCount, readingTime])

  if (isFallback) {
    return <div className={styles.post}>Carregando...</div>
  }

  return (
    <>
      <Head>
        <title>{post.data.title} | Spacetraveling</title>
      </Head>
      <main className={styles.postContainer}>
        <div className={styles.banner}>
          <img src={post.data.banner.url} alt="banner" />
        </div>

        <article className={`${styles.post} ${commonStyles.content}`}>
          <h1 className={styles.postTitle}>{post.data.title}</h1>
          <div className={commonStyles.postInfo}>
            <time><FiCalendar />
              {
                format(
                  new Date(post.first_publication_date),
                  "dd MMM yyyy",
                  { locale: ptBR }
                )
              }</time>
            <span><FiUser />{post.data.author}</span>
            <span><FiClock />{readingTime} min</span>
          </div>
          {
            post.data.content.map(({ body, heading }, idx) => (
              <div key={idx}>
                <h1>{heading}</h1>
                <div dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(body)
                }} />
              </div>
            ))
          }
        </article>
      </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'post')
  ]);

  const paths = posts.results.map(post => ({
    params: { slug: post.uid },
  }))

  return {
    paths,
    fallback: true,
  }
};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(context.params.slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url
      },
      content: response.data.content
    }
  };

  return {
    props: {
      post: post
    },
    // revalidate: 1,
    revalidate: 60 * 5, // 5 minutos
  }
};
