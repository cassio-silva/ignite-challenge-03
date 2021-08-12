import { useState } from 'react';
import next, { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { getPrismicClient } from '../services/prismic';
import { FiCalendar, FiUser } from 'react-icons/fi';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { useEffect } from 'react';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [nextPosts, setNextPosts] = useState<Post[]>([]);

  async function loadMorePosts() {
    const postsResp: PostPagination = await fetch(postsPagination.next_page).then(response => response.json());

    const newPosts = postsResp.results.map(res => {
      return {
        uid: res.uid,
        first_publication_date: res.first_publication_date,
        data: {
          title: res.data.title,
          subtitle: res.data.subtitle,
          author: res.data.author
        }
      }
    });
    setNextPosts([...newPosts]);
  }

  return (
    <>
      <Head>
        <title>Home | spacetraveling</title>
      </Head>
      <main className={styles.container}>
        <div className={`${styles.content} ${commonStyles.content}`}>
          {
            postsPagination.results.map(post => (
              <Link key={post.uid} href={`/post/${post.uid}`}>
                <a>
                  <strong>{post.data.title}</strong>
                  <h2>{post.data.subtitle}</h2>
                  <div className={commonStyles.postInfo}>
                    <time>
                      <FiCalendar size={18} />
                      {format(
                        new Date(post.first_publication_date),
                        "dd MMM yyyy",
                        { locale: ptBR }
                      )}
                    </time>
                    <span><FiUser size={18} />{post.data.author}</span>
                  </div>
                </a>
              </Link>
            ))
          }
          {
            nextPosts.map(post => (
              <Link key={post.uid} href={`/post/${post.uid}`}>
                <a>
                  <strong>{post.data.title}</strong>
                  <h2>{post.data.subtitle}</h2>
                  <div className={commonStyles.postInfo}>
                    <time>
                      <FiCalendar size={18} />
                      {format(
                        new Date(post.first_publication_date),
                        "dd MMM yyyy",
                        { locale: ptBR }
                      )}
                    </time>
                    <span><FiUser size={18} />{post.data.author}</span>
                  </div>
                </a>
              </Link>
            ))
          }
          {
            postsPagination.next_page ? (
              <button
                className={styles.loadMore}
                onClick={loadMorePosts}
              >
                Carregar mais posts
              </button>
            ) : (null)
          }
        </div>
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'post'),
  ], {
    fetch: [
      'post.title',
      'post.author',
      'post.subtitle',
      'post.uid',
      'post.first_publication_date'
    ],
    pageSize: 2,
  });

  console.log(JSON.stringify(postsResponse, null, 2))

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author
      },
    }
  })

  // console.log(JSON.stringify(posts, null, 2))

  return {
    props: {
      postsPagination: {
        results: posts,
        next_page: postsResponse.next_page
      }
    }
  }
};
