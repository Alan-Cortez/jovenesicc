import styles from './loading.module.css';

export default function Loading() {
  return (
    <div className={styles.root}>
      <div className={styles.banner} />
      <div className={styles.body}>
        <div className={styles.greet} />
        <div className={styles.twoCol}>
          <div className={styles.col}>
            <div className={styles.block} style={{ height: '120px' }} />
            <div className={styles.block} style={{ height: '90px' }} />
            <div className={styles.block} style={{ height: '90px' }} />
          </div>
          <div className={styles.col}>
            <div className={styles.block} style={{ height: '80px' }} />
            <div className={styles.block} style={{ height: '80px' }} />
            <div className={styles.block} style={{ height: '80px' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
