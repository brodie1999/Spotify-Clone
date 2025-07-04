import psycopg2


def test_connection():
    # Acquire a connection and emit a simple SQL statement
    try:
        conn = psycopg2.connect(dbname="spotify_clone",
                                    user="postgres",
                                    password="Kasparov1",
                                    host="localhost",
                                    port="5432"
                                    )
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        conn.close()
        print("CONNECTION SUCCESS")
    except:
        return print("CONNECTION FAILED")



if __name__ == "__main__":
    test_connection()
    print("CONNECTION TEST DONE")
