"use client";

import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { debounce } from "lodash";
import { Loader2, Search } from "lucide-react";
import { useAuth } from "../../../../../context/AuthContext";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";

export function SearchComponent({ apiEndpoint, renderCard, placeholder }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { checkAuth } = useAuth();
  const router = useRouter();

  const searchItems = useCallback(
    async (searchQuery) => {
      if (searchQuery.trim() === "") {
        setResults([]);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const isAuth = await checkAuth();
        if (!isAuth) {
          router.push("/");
          return;
        }
        const response = await axios.get(
          `${apiEndpoint}?q=${encodeURIComponent(searchQuery)}`
        );
        setResults(response.data.data);
      } catch (err) {
        setError("An error occurred while searching. Please try again.");
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [apiEndpoint, checkAuth, router]
  );

  const debouncedSearch = useCallback(debounce(searchItems, 300), [
    searchItems,
  ]);

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleInputChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    debouncedSearch(newQuery);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 relative">
      <div className="relative">
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          className="w-full pl-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      </div>
      {isLoading && (
        <div className="flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
      {error && <p className="text-red-500 text-center">{error}</p>}
      {results.length > 0 ? (
        <div className="absolute left-0 right-0 z-50 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-2">
          <ScrollArea className="flex flex-col gap-3 max-h-60 overflow-y-auto p-4">
            {results.map((item) => (
              <Card
                key={item.id}
                className="hover:bg-gray-100 transition-colors duration-200"
              >
                <CardContent className="p-4">{renderCard(item)}</CardContent>
              </Card>
            ))}
          </ScrollArea>
        </div>
      ) : (
        query &&
        !isLoading && (
          <p className="text-center text-muted-foreground">No results found.</p>
        )
      )}
    </div>
  );
}
